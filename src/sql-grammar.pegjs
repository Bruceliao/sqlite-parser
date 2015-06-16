/* Helper Functions */
{
      // Parser utilities
  var _ = require('./sql-parser-util');
}

/* Start Grammar */
start
  = s:( stmt )*
  {
    return {
      'statement': (_.isOkay(s) ? s : [])
    };
  }

/**
 * Expression definition reworked without left recursion for pegjs
 * {@link https://www.sqlite.org/lang_expr.html}
 */
expression "Expression"
  = t:( expression_concat / expression_types ) o
  { return t; }

expression_types
  = expression_wrapped / expression_node / expression_value

expression_concat
  = l:( expression_types ) o o:( binary_loop_concat ) o r:( expression )
  {
    return {
      'type': 'expression',
      'format': 'binary',
      'variant': 'operation',
      'operation': _.key(o),
      'left': l,
      'right': r,
      'modifier': null
    };
  }

expression_wrapped
  = sym_popen o n:( expression_node / expression_value ) o sym_pclose
  { return n; }

expression_value
  = expression_cast
  / expression_exists
  / expression_case
  / expression_raise
  / expression_unary
  / bind_parameter
  / function_call
  / literal_value
  / id_column

expression_unary
  = o:( operator_unary ) o e:( expression )
  {
    return {
      'type': 'expression',
      'format': 'unary',
      'variant': 'logical', // or { 'format': 'unary' }
      'expression': e,
      'modifier': o // TODO: could be { 'operator': o }
    };
  }

expression_cast
  = CAST o sym_popen e:( expression ) o a:( type_alias ) o sym_pclose
  {
    return {
      'type': 'expression',
      'format': 'unary',
      'variant': 'cast',
      'expression': e,
      'modifier': a
    };
  }

type_alias
  = AS e d:( type_definition )
  { return d; }

expression_exists
  = ( n:( NOT e )? x:( EXISTS e ) )? o e:( stmt_select )
  {
    return {
      'type': 'expression',
      'format': 'unary',
      'variant': 'select',
      'expression': e,
      'modifier': _.compose([n, x])
    };
  }

expression_case
  = CASE e e:( expression )? o w:( expression_case_when )+ o s:( expression_case_else )? o END o
  {
    // TODO: Not sure about this
    return {
      'type': 'expression',
      'format': 'binary',
      'variant': 'case',
      'case': e,
      'expression': _.compose([w, s], []),
      'modifier': null
    };
  }


expression_case_when
  = WHEN e w:( expression ) o THEN e t:( expression ) o
  {
    return {
      'type': 'condition',
      'format': 'when',
      'condition': w,
      'expression': t,
      'modifier': null
    };
  }

expression_case_else
  = ELSE e e:( expression ) o
  {
    return {
      'type': 'condition',
      'format': 'else',
      'expression': e,
      'modifier': null
    };
  }

expression_raise
  = RAISE sym_popen o a:( expression_raise_args ) o sym_pclose
  {
    return {
      'type': 'expression',
      'format': 'unary',
      'variant': 'raise',
      'expression': a,
      'modifier': null
    };
  }

expression_raise_args
  = raise_args_ignore
  / raise_args_message

raise_args_ignore
  = f:( IGNORE )
  { return _.textNode(f); }

raise_args_message
  = f:( ROLLBACK / ABORT / FAIL ) o sym_comma o m:( error_message )
  { return _.textNode(f) + ', \'' + m + '\''; }

/* Expression Nodes */
expression_node
  = expression_collate
  / expression_compare
  / expression_null
  / expression_is
  / expression_between
  / expression_in
  / operation_binary

/** @note Removed expression on left-hand-side to remove recursion */
expression_collate
  = v:( expression_value ) o COLLATE e n:( name_collation )
  {
    return {
      'type': 'expression',
      'format': 'unary',
      'variant': 'collate',
      'expression': v,
      'modifier': {
        'type': 'name',
        'name': n // TODO: could also be { 'name': n }
      }
    };
  }

/** @note Removed expression on left-hand-side to remove recursion */
expression_compare
  = v:( expression_value ) o n:( NOT e )? m:( LIKE / GLOB / REGEXP / MATCH ) e e:( expression ) o x:( expression_escape )?
  {
    return {
      'type': 'expression',
      'format': 'binary',
      'variant': 'operation',
      'operation': _.key(_.compose([n, m])),
      'left': v,
      'right': e,
      'modifier': x
    };
  }

expression_escape
  = ESCAPE e e:( expression )
  {
    return {
      'type': 'escape',
      'expression': e
    };
  }

/** @note Removed expression on left-hand-side to remove recursion */
expression_null
  = v:( expression_value ) o n:( expression_null_nodes )
  {
    return {
      'type': 'expression',
      'format': 'unary',
      'variant': 'null',
      'expression': v,
      'modifier': n
    };
  }

expression_null_nodes
  = i:( IS / NOT ) o n:( NULL ) {
    return _.compose([i, n]);
  }

/** @note Removed expression on left-hand-side to remove recursion */
expression_is
  = v:( expression_value ) o i:( IS e ) n:( NOT e )? e:( expression )
  {
    return {
      'type': 'expression',
      'format': 'binary',
      'variant': 'operation',
      'operation': _.key(_.compose([i, n])),
      'left': v,
      'right': e,
      'modifier': null
    };
  }

/** @note Removed expression on left-hand-side to remove recursion */
expression_between
  = v:( expression_value ) o n:( NOT e )? b:( BETWEEN e ) e1:( expression ) AND e e2:( expression )
  {
    return {
      'type': 'expression',
      'format': 'binary',
      'variant': 'operation',
      'operation': _.key(_.compose([n, b])),
      'left': v,
      'right': {
        'type': 'range',
        'left': e1,
        'right': e2
      },
      'modifier': null
    };
  }


/** @note Removed expression on left-hand-side to remove recursion */
expression_in
  = v:( expression_value ) o n:( NOT e )? i:( IN e ) e:( expression_in_target )
  {
    return {
      'type': 'expression',
      'format': 'binary',
      'variant': 'operation',
      'operation': _.key(_.compose([n, i])),
      'left': v,
      'right': e,
      'modifier': null
    };
  }

expression_in_target
  = expression_list_or_select
  / id_table

expression_list_or_select
  = sym_popen o e:( stmt_select / expression_list ) o sym_pclose
  { return e; }


/**
 * Type definitions
 */
 type_definition "Type Definition"
  = n:( datatype_types ) o a:( type_definition_args )?
  {
    return _.extend({
      'type': 'datatype',
      'format': n[0],
      'affinity': n[1],
      'args': [] // datatype definition arguments
    }, a);
  }

type_definition_args
  = sym_popen a1:( literal_number_signed ) o a2:( definition_args_loop )? sym_pclose
  {
    return {
      'args': _.compose([a1, a2], [])
    };
  }

definition_args_loop
  = sym_comma o n:( literal_number_signed ) o
  { return n; }

/**
 * Literal value definition
 * {@link https://www.sqlite.org/syntax/literal-value.html}
 */
literal_value "Literal Value"
  = literal_number
  / literal_string
  / literal_blob
  / literal_null
  / literal_date

literal_null
  = n:( NULL ) o
  {
    return {
      'type': 'literal',
      'variant': 'null',
      'value': _.textNode(n)
    };
  }

literal_date
  = d:( CURRENT_DATE / CURRENT_TIMESTAMP / CURRENT_TIME ) o
  {
    return {
      'type': 'literal',
      'variant': 'date',
      'value': _.textNode(d)
    };
  }

/**
 * Notes:
 *    1) SQL uses single quotes for string literals.
 *    2) Value is an identier or a string literal based on context.
 * {@link https://www.sqlite.org/lang_keywords.html}
 */
literal_string
  = s:( literal_string_single )
  {
    return {
      'type': 'literal',
      'variant': 'string',
      'value': _.textNode(s)
    };
  }

literal_string_single
  = sym_sglquote s:( literal_string_schar )* sym_sglquote
  {
    /**
      * @note Unescaped the pairs of literal single quotation marks
      */
    return _.unescape(_.textNode(s));
  }

literal_string_schar
  = "''"
  / [^\']

literal_blob
  = [x]i b:( literal_string_single )
  {
    return {
      'type': 'literal',
      'variant': 'blob',
      'value': _.textNode(b)
    };
  }

number_sign
  = s:( sym_plus / sym_minus )
  { return _.textNode(s); }

literal_number_signed
  = s:( number_sign )? n:( literal_number )
  {
    if (_.isOkay(s)) {
      n['value'] = _.compose([s, n['value']]);
    }
    return n;
  }

literal_number
  = literal_number_decimal
  / literal_number_hex

literal_number_decimal
  = d:( number_decimal_node ) e:( number_decimal_exponent )?
  {
    return {
      'type': 'literal',
      'variant': 'decimal',
      'value': _.compose([d, e], '')
    };
  }

number_decimal_node
  = number_decimal_full
  / number_decimal_fraction

number_decimal_full
  = f:( number_digit )+ b:( number_decimal_fraction )?
  { return _.compose([f, b], ''); }

number_decimal_fraction
  = t:( sym_dot ) d:( number_digit )+
  { return _.compose([t, d], ''); }

/* TODO: Not sure about "E"i or just "E" */
number_decimal_exponent
  = e:( "E"i ) s:( [\+\-] )? d:( number_digit )+
  { return _.compose([e, s, d], ''); }

literal_number_hex
  = f:( "0x"i ) b:( number_hex )*
  {
    return {
      'type': 'literal',
      'variant': 'hexidecimal',
      'value': _.compose([f, b], '')
    };
  }

number_hex
  = [0-9a-f]i

number_digit
  = [0-9]

/**
 * Bind Parameters have several syntax variations:
 * 1) "?" ( [0-9]+ )?
 * 2) [\$\@\:] name_char+
 * {@link https://www.sqlite.org/c3ref/bind_parameter_name.html}
 */
bind_parameter "Bind Parameter"
  = bind_parameter_numbered
  / bind_parameter_named
  / bind_parameter_tcl

/**
 * Bind parameters start at index 1 instead of 0.
 */
bind_parameter_numbered
  = q:( sym_quest ) id:( [1-9] [0-9]* )? o
  {
    return {
      'type': 'variable',
      'format': 'numbered',
      'name': _.compose([q, id], '')
    };
  }

bind_parameter_named
  = s:( [\:\@] ) name:( name_char )+ o
  {
    return {
      'type': 'variable',
      'format': 'named',
      'name': _.compose([s, name], '')
    };
  }

bind_parameter_tcl
  = d:( "$" ) name:( name_char / [\:] )+ o suffix:( bind_parameter_named_suffix )?
  {
    return {
      'type': 'variable',
      'format': 'tcl',
      'name': _.compose([_.compose([d, name], ''), suffix])
    };
  }

bind_parameter_named_suffix
  = q1:( sym_dblquote ) n:( !sym_dblquote any )* q2:( sym_dblquote )
  { return _.compose([q1, n, q2], ''); }

/** @note Removed expression on left-hand-side to remove recursion */
operation_binary
  = v:( expression_value ) o o:( operator_binary ) o e:( expression_types )
  {
    return {
      'type': 'expression',
      'format': 'binary',
      'variant': 'operation',
      'operation': _.key(o),
      'left': v,
      'right': e,
      'modifier': null
    };
  }

binary_loop_concat
  = c:( AND / OR ) e
  { return _.textNode(c); }

expression_list "Expression List"
  = f:( expression ) rest:( expression_list_rest )*
  {
    return _.compose([f, rest], []);
  }

expression_list_rest
  = o sym_comma e:( expression )
  { return e; }

function_call
  = n:( name_function ) sym_popen a:( function_call_args )? sym_pclose
  {
    return _.extend({
      'type': 'function',
      'name': n,
      'distinct': false,
      'args': []
    }, a);
  }

function_call_args
  = s:( select_star ) {
    return {
      'distinct': false,
      'args': [{
        'type': 'identifier',
        'variant': 'star',
        'name': s
      }]
    };
  }
  / ( d:( DISTINCT e )? e:( expression_list ) ) {
    return {
      'distinct': _.isOkay(d),
      'args': e
    };
  }

error_message "Error Message"
  = literal_string

stmt "Statement"
  = m:( stmt_modifier )? o s:( stmt_nodes ) o ( sym_semi )?
  {
    return _.extend({
      'modifier': null
    }, m, s);
  }

stmt_modifier
  = e:( EXPLAIN ) e q:( QUERY e PLAN e )?
  {
    // TODO: Format?
    return {
      'modifier': {
        'type': _.key(e),
        'explain': 'query plan'
      }
    };
  }

stmt_nodes
  = stmt_crud
  / stmt_create
  / stmt_drop
  / stmt_transaction
  / stmt_alter
  / stmt_rollback

/*stmt_nodes
  = stmt_crud
  / stmt_create
  / stmt_drop
  / stmt_transaction
  / stmt_alter*/

/*stmt_transaction
  = stmt_commit
  / stmt_rollback
  / stmt_begin*/

stmt_transaction
  = b:( stmt_begin ) s:( stmt )* e:( stmt_commit )
  {
    return {
      'type': 'statement',
      'variant': 'transaction',
      'statement': _.isOkay(s) ? s : [],
      'modifier': b
    };
  }

stmt_commit
  = s:( COMMIT / END ) ( e TRANSACTION )? o
  {
    // return {
    //   'type': 'statement',
    //   'variant': 'transaction',
    //   'action': 'commit'
    // };
    return _.key(s);
  }

stmt_begin
  = s:( BEGIN ) e m:( ( DEFERRED / IMMEDIATE / EXCLUSIVE ) e )? ( TRANSACTION e )?
  {
    // TODO: Format
    // return {
    //   'type': 'statement',
    //   'variant': 'transaction',
    //   'action': _.key(s),
    //   'modifier': _.key(m)
    // };
    return _.key(m);
  }

stmt_rollback
  = s:( ROLLBACK ) e ( TRANSACTION e )? n:( rollback_savepoint )?
  {
    return {
      'type': 'statement',
      'variant': 'transaction',
      'action': _.key(s),
      'savepoint': n
    };
  }

rollback_savepoint
  = TO e ( SAVEPOINT e )? n:( id_savepoint ) e
  { return n; }

stmt_alter
  = s:( ALTER e TABLE ) e n:( id_table ) e:( alter_action ) o
  {
    return {
      'type': 'statement',
      'variant': _.key(s)
    };
  }

alter_action
  = alter_action_rename
  / alter_action_add

alter_action_rename
  = s:( RENAME ) e TO e n:( id_table )
  {
    return {
      'action': _.key(s),
      'name': n
    };
  }

alter_action_add
  = s:( ADD ) e ( COLUMN e )? d:( source_def_column )
  {
    return {
      'action': _.key(s),
      'definition': d
    };
  }

stmt_crud
  = w:( clause_with )? o s:( stmt_crud_types )
  { return _.extend(s, w); }

clause_with "WITH Clause"
  = WITH e r:( RECURSIVE e )? f:( expression_table ) o r:( clause_with_loop )*
  {
    // TODO: final format
    return {
      'with': {
        'type': 'with',
        'recursive': isOkay(r),
        'expression': _.compose([f, r], [])
      }
    };
  }

clause_with_loop
  = sym_comma e:( expression_table )
  { return e; }

/* TODO: This isn't done */
expression_table "Table Expression"
  = n:( name_table ) o a:( sym_popen name_column ( sym_comma name_column )* sym_pclose )? o AS e s:( stmt_select )

stmt_crud_types
  = stmt_select
  / stmt_insert
  / stmt_update
  / stmt_delete

/** {@link https://www.sqlite.org/lang_select.html} */
stmt_select "SELECT Statement"
  = s:( select_loop ) o o:( stmt_core_order )? o l:( stmt_core_limit )?
  {
    return _.extend(s, {
      'order': o,
      'limit': l
    });
  }

stmt_core_order
  = ORDER e BY e d:( stmt_core_order_list )
  { return d; }

stmt_core_limit
  = LIMIT e e:( expression ) o d:( stmt_core_limit_offset )?
  {
    return {
      'start': e,
      'offset': d
    };
  }

stmt_core_limit_offset
  = o:( ( OFFSET e ) / sym_comma ) e:( expression )
  { return e; }

select_loop
  = s:( select_parts ) o u:( select_loop_union )*
  {
    if ( _.isOkay(u) ) {
      // TODO: compound query
    }
    return s;
  }

select_loop_union
  = c:( operator_compound ) o s:( select_parts )
  {
    // TODO: compound query
  }

select_parts
  = select_parts_core
  / select_parts_values

select_parts_core
  = s:( select_core_select ) o f:( select_core_from )? o w:( stmt_core_where )? o g:( select_core_group )? o
  {
    // TODO: Not final syntax!
    if (!_.isArray(f)) {
      if (!_.isOkay(f)) {
        f = [];
      } else {
        f = [f];
      }
    }
    return _.extend({
      'type': 'statement',
      'variant': 'select',
      'from': f,
      'where': w,
      'group': g
    }, s);
  }

select_core_select
  = SELECT e d:( DISTINCT / ALL )? o t:( select_target )
  {
    var mod = {};
    if (_.isOkay(d)) {
      mod[_.textNode(d).toLowerCase()] = true;
    }
    return _.extend({
      'result': t,
      'distinct': false,
      'all': false
    }, mod);
  }

select_target
  = f:( select_node ) o r:( select_target_loop )*
  {
    return _.compose([f, r], []);
  }

select_target_loop
  = sym_comma n:( select_node )
  { return n; }

select_core_from
  = FROM e s:( select_source )
  { return s; }

stmt_core_where
  = WHERE e e:( expression )
  { return _.makeArray(e); }

select_core_group
  = GROUP e BY e e:( expression ) h:( select_core_having )?
  {
    // TODO: format
    return {
      'expression': _.makeArray(e),
      'having': h
    };
  }

select_core_having
  = HAVING e e:( expression )
  { return e; }

select_node
  = select_node_star
  / select_node_aliased

select_node_star
  = q:( select_node_star_qualified )? s:( select_star )
  {
    return {
      'type': 'identifier',
      'variant': 'star',
      'name': _.compose([q, s], '')
    };
  }

select_node_star_qualified
  = n:( name_table ) s:( sym_dot )
  { return _.compose([n, s], ''); }

select_node_aliased
  = e:( expression ) o a:( alias )?
  {
    // TODO: format
    return _.extend(e, {
      'alias': a
    });
  }

select_source
  = select_join_loop
  / select_source_loop

select_source_loop
  = f:( table_or_sub ) t:( source_loop_tail )*
  { return _.compose([f, t], []); }

source_loop_tail
  = sym_comma t:( table_or_sub )
  { return t; }

table_or_sub
  = table_or_sub_sub
  / table_qualified

table_qualified
  = d:( table_qualified_id ) i:( table_or_sub_index )?
  {
    return _.extend(d, {
      'index': i
    });
  }

table_qualified_id
  = n:( id_table ) o a:( alias )?
  {
    return _.extend(n, {
      'alias': a
    });
  }

/* TODO: Need final format */
table_or_sub_index
  = i:( table_or_sub_index_node )
  {
    return {
      'type': 'index',
      'index': i
    };
  }

table_or_sub_index_node
  = ( INDEXED e BY e n:( name_index ) o ) {
    return _.textNode(n);
  }
  / n:( NOT e INDEXED o ) {
    return _.textNode(n);
  }

table_or_sub_sub
  = sym_popen o l:( select_join_loop / select_source_loop ) o sym_pclose
  { return l; }

alias
  = a:( AS e )? n:( name )
  { return n; }

select_join_loop
  = t:( table_or_sub ) o j:( select_join_clause )+
  {
    // TODO: format
    return {
      'type': 'map',
      'variant': 'join',
      'source': t,
      'map': j
    };
  }

select_join_clause
  = o:( join_operator ) o n:( table_or_sub ) o c:( join_condition )?
  {
    // TODO: format
    return _.extend({
      'type': 'join',
      'variant': _.key(o),
      'source': n,
      'on': null,
      'using': null
    }, c);
  }

join_operator
  = n:( NATURAL e )? o t:( join_operator_types )? j:( JOIN ) e
  { return _.compose([n, t, j]); }

join_operator_types
  = operator_types_hand
  / operator_types_misc

operator_types_hand
  = t:( LEFT / RIGHT / FULL ) e o:( types_hand_outer )?
  { return _.compose([t, o]); }

types_hand_outer
  = t:( OUTER ) e
  { return t; }

operator_types_misc
  = t:( INNER / CROSS ) e
  { return t; }

join_condition
  = c:( join_condition_on / join_condition_using )
  { return c; }

join_condition_on
  = ON e e:( expression )
  {
    return {
      'on': e
    };
  }

/* TODO: should it be name_column or id_column ? */
join_condition_using
  = USING e f:( id_column ) o b:( join_condition_using_loop )*
  {
    return {
      'using': _.compose([f, b], [])
    };
  }

/* TODO: should it be name_column or id_column ? */
join_condition_using_loop
  = sym_comma n:( id_column )
  { return n; }

select_parts_values
  = VALUES o l:( insert_values_list )
  {
    // TODO: format
    return {
      'type': 'statement',
      'variant': 'select',
      'result': l,
      'from': null,
      'where': null,
      'group': null
    };
  }

stmt_core_order_list
  = f:( stmt_core_order_list_item ) o b:( stmt_core_order_list_loop )?
  {
    return _.compose([f, b], []);
  }

stmt_core_order_list_loop
  = sym_comma i:( stmt_core_order_list_item )
  { return i; }

stmt_core_order_list_item
  = e:( expression ) o c:( column_collate )? o d:( stmt_core_order_list_dir )?
  {
    // TODO: Not final format
    return {
      'direction': _.textNode(d) /*|| 'ASC'*/,
      'expression': e,
      'collate': c
    };
  }

stmt_core_order_list_dir
  = primary_column_dir

select_star "All Columns"
  = sym_star

stmt_fallback_types
  = k:( REPLACE / ROLLBACK / ABORT / FAIL / IGNORE )
  { return k; }

/** {@link https://www.sqlite.org/lang_insert.html} */
stmt_insert "INSERT Statement"
  = k:( insert_keyword ) o t:( insert_target ) o p:( insert_parts )
  {
    // TODO: Not final syntax!
    return _.extend({
      'type': 'statement',
      'variant': 'insert',
      'into': null,
      'action': null,
      'or': null,
      'result': []
    }, k, t, p);
  }

insert_keyword
  = insert_keyword_ins
  / insert_keyword_repl

insert_keyword_ins
  = a:( INSERT ) e m:( insert_keyword_mod )?
  {
    return _.extend({
      'action': _.key(a)
    }, m);
  }

insert_keyword_repl
  = a:( REPLACE ) e
  {
    return {
      'action': _.key(a)
    };
  }

insert_keyword_mod
  = OR e m:( stmt_fallback_types )
  {
    return {
      'or': _.key(m)
    };
  }

insert_target
  = INTO e id:( id_table ) o cols:( loop_columns )?
  {
    return {
      'into': _.extend({
        'target': id,
        'columns': null
      }, cols)
    };
  }

loop_columns
  = sym_popen f:( loop_name_column ) o b:( loop_column_tail )* sym_pclose
  {
    return {
      'columns': _.compose([f, b], [])
    };
  }

loop_column_tail
  = sym_comma c:( loop_name_column ) o
  { return c; }

loop_name_column
  = n:( name_column )
  {
    return {
      'type': 'identifier',
      'variant': 'column',
      'name': n
    };
  }

insert_parts
  = r:( insert_value / stmt_select / insert_default ) o
  {
    return {
      'result': r
    };
  }

insert_value
  = VALUES o r:( insert_values_list )
  { return r; }

insert_values_list
  = f:( insert_values ) o b:( insert_values_loop )*
  { return _.compose([f, b], []); }

insert_values_loop
  = sym_comma e:( insert_values ) o
  { return e; }

insert_values
  = sym_popen e:( expression_list ) sym_pclose
  {
    return {
      'type': 'statement',
      'variant': 'values',
      'values': e
    };
  }

/* TODO: This doesn't seem like the right format for this variant */
insert_default
  = d:( DEFAULT ) e v:( VALUES )
  {
    return {
      'type': 'statement',
      'variant': 'default',
      'values': _.compose([d, v])
    };
  }

/* TODO: Not finished */
operator_compound "Compound Operator"
  = ( UNION ( e ALL )? )
  / INTERSECT
  / EXCEPT

/* Unary and Binary Operators */

operator_unary "Unary Operator"
  = sym_tilde
  / sym_minus
  / sym_plus
  / NOT

/* TODO: Needs return format refactoring */
operator_binary "Binary Operator"
  = o:( binary_concat
  / binary_multiply / binary_mod
  / binary_plus / binary_minus
  / binary_left / binary_right / binary_and / binary_or
  / binary_lte / binary_lt / binary_gte / binary_gt
  / binary_lang / binary_notequal / binary_equal )
  { return _.key(o); }

binary_concat "Or"
  = sym_pipe sym_pipe

binary_plus "Add"
  = sym_plus

binary_minus "Subtract"
  = sym_minus

binary_multiply "Multiply"
  = sym_star

binary_mod "Modulo"
  = sym_mod

binary_left "Shift Left"
  = sym_lt sym_lt

binary_right "Shift Right"
  = sym_gt sym_gt

binary_and "Logical AND"
  = sym_amp

binary_or "Logical OR"
  = sym_pipe

binary_lt "Less Than"
  = sym_lt

binary_gt "Greater Than"
  = sym_gt

binary_lte "Less Than Or Equal"
  = sym_lt sym_equal

binary_gte "Greater Than Or Equal"
  = sym_gt sym_equal

binary_equal "Equal"
  = sym_equal ( sym_equal )?

binary_notequal "Not Equal"
  = ( sym_excl sym_equal )
  / ( sym_lt sym_gt )

binary_lang
  = binary_lang_isnt
  / binary_lang_misc

binary_lang_isnt "IS"
  = i:( IS ) e n:( NOT e )?
  { return _.key(_.compose([i, n])); }

binary_lang_misc "Misc Binary Operator"
  = m:( IN / LIKE / GLOB / MATCH / REGEXP )
  { return _.key(m); }

/* Database, Table and Column IDs */

id_database
  = n:( name_database )
  {
    return {
      'type': 'identifier',
      'variant': 'database',
      'name': n
    };
  }

id_table
  = d:( id_table_qualified )? n:( name_table )
  {
    return {
      'type': 'identifier',
      'variant': 'table',
      'name': _.compose([d, n], '')
    };
  }

id_table_qualified
  = n:( name_database ) d:( sym_dot )
  { return _.compose([n, d], ''); }

id_column
  = d:( id_table_qualified )? t:( id_column_qualified )? n:( name_column )
  {
    return {
      'type': 'identifier',
      'variant': 'column',
      'name': _.compose([d, t, n], '')
    };
  }

id_column_qualified
  = t:( name_table ) d:( sym_dot )
  { return _.compose([t, d], ''); }

id_collation
  = n:( name_collation )
  {
    return {
      'type': 'identifier',
      'variant': 'collation',
      'name': n
    };
  }

id_savepoint
  = n:( name )
  {
    return {
      'type': 'identifier',
      'variant': 'savepoint',
      'name': n
    };
  }

/* TODO: FIX all name_* symbols */
name_database "Database Name"
  = name

name_table "Table Name"
  = name

name_column "Column Name"
  = name

name_constraint_table "Table Constraint Name"
  = name

name_constraint_column "Column Constraint Name"
  = name

name_collation "Collation Name"
  = name

name_index "Index Name"
  = name

name_function "Function Name"
  = name

/* Column datatypes */

datatype_types
  = t:( datatype_text ) { return [t, 'text']; }
  / t:( datatype_real ) { return [t, 'real']; }
  / t:( datatype_numeric ) { return [t, 'numeric']; }
  / t:( datatype_integer ) { return [t, 'integer']; }
  / t:( datatype_none ) { return [t, 'none']; }

datatype_text
  = t:( ( ( "N"i )? ( "VAR"i )? "CHAR"i )
  / ( ( "TINY"i / "MEDIUM"i / "LONG"i )? "TEXT"i )
  / "CLOB"i )
  { return _.key(t); }

datatype_real
  = t:( ( "DOUBLE"i ( e "PRECISION"i )? )
  / "FLOAT"i
  / "REAL"i )
  { return _.key(t); }

datatype_numeric
  = t:( "NUMERIC"i
  / "DECIMAL"i
  / "BOOLEAN"i
  / ( "DATE"i ( "TIME"i )? )
  / ( "TIME"i ( "STAMP"i )? ) )
  { return _.key(t); }

datatype_integer
  = t:( ( "INT"i ( "2" / "4" / "8" / "EGER"i ) )
  / ( ( "BIG"i / "MEDIUM"i / "SMALL"i / "TINY"i )? "INT"i ) )
  { return _.key(t); }

datatype_none
  = t:( "BLOB"i )
  { return _.key(t); }

/**
 * @note Includes limited update syntax {@link https://www.sqlite.org/syntax/update-stmt-limited.html}
 */
stmt_update "UPDATE Statement"
  = u:( clause_with )? o s:( update_start ) f:( update_fallback )? t:( table_qualified ) o u:( update_set ) w:( update_where )? o o:( stmt_core_order )? o l:( stmt_core_limit )?
  {
    // TODO: Not final syntax!
    return _.extend({
      'type': 'statement',
      'variant': s,
      'into': t,
      'where': w,
      'set': [],
      'order': o,
      'limit': l
    }, u, f);
  }

update_start
  = s:( UPDATE ) e
  { return _.key(s); }

update_fallback
  = OR e t:( stmt_fallback_types ) e
  {
    return {
      'or': _.key(t)
    };
  }

update_set
  = SET e c:( update_columns ) o
  {
    return {
      'set': c
    };
  }

update_columns
  = f:( update_column ) b:( update_columns_tail )*
  { return _.compose([f, b], []); }

update_columns_tail
  = o sym_comma c:( update_column )
  { return c; }

update_column
  = f:( id_column ) o sym_equal e:( expression_types ) o
  {
    return {
      'type': 'assignment',
      'target': f,
      'value': e
    };
  }

update_where
  = w:( stmt_core_where ) o
  { return w; }

/**
 * @note Includes limited update syntax {@link https://www.sqlite.org/syntax/delete-stmt-limited.html}
 */
stmt_delete "DELETE Statement"
  = u:( clause_with )? o s:( delete_start ) t:( table_qualified ) o w:( delete_where )? o o:( stmt_core_order )? o l:( stmt_core_limit )?
  {
    // TODO: Not final syntax!
    return _.extend({
      'type': 'statement',
      'variant': s,
      'from': t,
      'where': w,
      'order': o,
      'limit': l
    }, u);
  }

delete_start
  = s:( DELETE ) e FROM e
  { return _.key(s); }

delete_where
  = w:( stmt_core_where ) o
  { return w; }

/* TODO: Complete */
stmt_create "CREATE Statement"
  = create_index
  / create_table
  / create_trigger
  / create_view
  / create_virtual

create_index "CREATE Index"
  = _TODO_

create_table "CREATE Table"
  = CREATE e tmp:( create_table_tmp )? TABLE e ne:( create_ine )? id:( id_table ) e s:( create_table_source )
  {
    return _.extend({
      'type': 'statement',
      'variant': 'create',
      'format': 'table',
      'temporary': _.isOkay(tmp),
      'target': id,
      'condition': null,
      'modifier': null,
      'definition': []
    }, s, ne);
  }

create_table_tmp
  = t:( TEMP / TEMPORARY ) e
  { return _.key(t); }

create_ine
  = i:( IF ) e n:( NOT ) e e:( EXISTS ) e
  {
    return {
      'condition': _.key(_.compose([i, n, e]))
    };
  }

create_table_source
  = table_source_def
  / table_source_select

table_source_def
  = sym_popen s:( source_def_loop ) o sym_pclose r:( source_def_rowid )?
  {
    return {
      'definition': s,
      'modifier': r
    };
  }

source_def_rowid
  = r:( WITHOUT e ROWID ) o
  { return _.key(r); }

source_def_loop
  = f:( source_def_types ) o b:( source_def_tail )*
  { return _.compose([f, b], []); }

source_def_tail
  = sym_comma t:( source_def_types ) o
  { return t; }

source_def_types
  = table_constraint
  / source_def_column

/** {@link https://www.sqlite.org/syntaxdiagrams.html#column-def} */
source_def_column
  = n:( name_column ) e t:( column_type )? o c:( column_constraints )?
  {
    return _.extend({
      'type': 'definition',
      'variant': 'column',
      'name': n,
      'definition': (_.isOkay(c) ? c : []),
      'datatype': null
    }, t);
  }

column_type
  = t:( type_definition )
  {
    return {
      'datatype': t
    };
  }

column_constraints
  = f:( column_constraint ) b:( column_constraint_tail )* o
  { return _.compose([f, b], []); }

column_constraint_tail
  = o c:( column_constraint )
  { return c; }

/** {@link https://www.sqlite.org/syntax/column-constraint.html} */
column_constraint "Column Constraint"
  = n:( column_constraint_name )? c:( column_constraint_types )
  {
    return _.extend({
      'name': n
    }, c);
  }

column_constraint_name
  = CONSTRAINT e n:( name_constraint_column ) o
  { return n; }

column_constraint_types
  = column_constraint_primary
  / column_constraint_null
  / constraint_check
  / column_constraint_default
  / column_constraint_collate
  / column_constraint_foreign

column_constraint_foreign
  = f:( foreign_clause )
  {
    return _.extend({
      'variant': 'foreign key'
    }, f);
  }

column_constraint_primary
  = p:( col_primary_start ) d:( col_primary_dir )? c:( primary_conflict )? a:( col_primary_auto )? o
  {
    return _.extend(p, c, d, a);
  }

col_primary_start
  = s:( PRIMARY e KEY ) o
  {
    return {
      'type': 'constraint',
      'variant': _.key(s),
      'conflict': null,
      'direction': null,
      'modififer': null,
      'autoIncrement': false
    };
  }

col_primary_dir
  = d:( primary_column_dir ) o
  {
    return {
      'direction': _.key(d)
    };
  }

col_primary_auto
  = a:( AUTOINCREMENT ) o
  {
    return {
      'autoIncrement': true
    };
  }

column_constraint_null
  = s:( constraint_null_types ) c:( primary_conflict )? o
  {
    return _.extend({
      'type': 'constraint',
      'variant': s,
      'conflict': null
    }, c);
  }

constraint_null_types
  = t:( ( NOT e NULL )
  / UNIQUE ) o
  { return _.key(t); }

column_constraint_default
  = s:( DEFAULT ) v:( col_default_val )
  {
    return {
      'type': 'constraint',
      'variant': _.key(s),
      'value': v
    };
  }

col_default_val
  = ( o v:( expression_wrapped ) ) { return v; }
  / ( e v:( literal_number_signed ) ) { return v; }
  / ( e v:( literal_value ) ) { return v; }

column_constraint_collate
  = c:( column_collate )
  {
    return {
      'type': 'constraint',
      'variant': 'collate',
      'collate': c
    };
  }

/** {@link https://www.sqlite.org/syntax/table-constraint.html} */
table_constraint
  = n:( table_constraint_name )? o c:( table_constraint_types ) o
  {
    return _.extend({
      'type': 'definition',
      'variant': 'constraint',
      'name': n,
      'expression': null
    }, c);
  }

table_constraint_name
  = CONSTRAINT e n:( name_constraint_table )
  { return n; }

table_constraint_types
  = table_constraint_foreign
  / table_constraint_primary
  / constraint_check

table_constraint_primary
  = k:( primary_start ) o c:( primary_columns ) t:( primary_conflict )?
  {
    return {
      'expression': _.extend(k, t),
      'columns': c
    };
  }

primary_start
  = s:( primary_start_normal / primary_start_unique ) o
  {
    return {
      'type': 'constraint',
      'variant': _.key(s),
      'conflict': null
    };
  }

primary_start_normal
  = p:( PRIMARY ) e k:( KEY )
  { return _.compose([p, k]); }

primary_start_unique
  = u:( UNIQUE )
  { return _.textNode(u); }

primary_columns
  = sym_popen f:( primary_column ) o b:( primary_column_tail )* sym_pclose
  { return _.compose([f, b], []); }

primary_column "Indexed Column"
  = e:( name_column ) o c:( column_collate )? o d:( primary_column_dir )? o
  {
    // TODO: Not final format
    return {
      'type': 'identifier',
      'variant': 'column',
      'format': 'indexed',
      'direction': _.key(d) /*|| "ASC"*/,
      'name': e,
      'collate': c
    };
  }

column_collate
  = COLLATE e n:( id_collation )
  { return n; }

primary_column_dir
  = t:( ASC / DESC ) o
  { return _.textNode(t); }

primary_column_tail
  = sym_comma c:( primary_column ) o
  { return c; }

primary_conflict
  = o:( ON ) e c:( CONFLICT ) e t:( stmt_fallback_types ) o
  {
    return {
      'conflict': _.key(t)
    };
  }

constraint_check
  = k:( CHECK ) o c:( expression_wrapped )
  {
    return {
      'type': 'constraint',
      'variant': _.key(k),
      'expression': c
    };
  }

table_constraint_foreign
  = k:( foreign_start ) o l:( loop_columns ) o c:( foreign_clause ) o
  {
    return _.extend({
      'expression': _.extend(k, c)
    }, l);
  }

foreign_start
  = f:( FOREIGN ) e k:( KEY )
  {
    return {
      'type': 'constraint',
      'variant': _.key(_.compose([f, k])),
      'target': null,
      'columns': null,
      'action': null,
      'deferrable': null
    };
  }

/** {@link https://www.sqlite.org/syntax/foreign-key-clause.html} */
foreign_clause
  = r:( foreign_references ) a:( foreign_actions )? d:( foreign_deferrable )?
  {
    return _.extend({
      'type': 'constraint',
      'action': a,
      'deferrable': d
    }, r);
  }

foreign_references
  = REFERENCES e t:( id_table ) o c:( loop_columns )?
  {
    // TODO: FORMAT?
    return _.extend({
      'target': t
    }, c);
  }

foreign_actions
  = f:( foreign_action ) o b:( foreign_actions_tail )* o
  { return _.collect([f, b], []); }

foreign_actions_tail
  = e a:( foreign_action )
  { return a; }

/* TODO: action format? */
foreign_action
  = foreign_action_on
  / foreign_action_match

foreign_action_on
  = m:( ON ) e a:( DELETE / UPDATE ) e n:( action_on_action )
  {
    return {
      'type': 'action',
      'variant': _.key(m),
      'action': n
    };
  }

action_on_action
  = a:( ( SET e ( NULL / DEFAULT ) )
  / ( CASCADE / RESTRICT )
  / ( NO e ACTION ) )
  { return _.key(a); }

/* TODO: name format? */
foreign_action_match
  = m:( MATCH ) e n:( name )
  {
    return {
      'type': 'action',
      'variant': _.key(m),
      'action': n
    };
  }

foreign_deferrable
  = n:( NOT e )? d:( DEFERRABLE ) i:( e INITIALLY e ( DEFERRED / IMMEDIATE ) )?
  { return _.collect([n, d, i]); }

table_source_select
  = AS e s:( stmt_select )
  {
    return {
      'result': s
    };
  }

create_trigger "CREATE Trigger"
  = _TODO_

create_view "CREATE View"
  = _TODO_

create_virtual "CREATE Virtual Table"
  = _TODO_

stmt_drop "DROP Table Statement"
  = s:( drop_start ) t:( drop_types ) i:( drop_ie )? q:( id_table ) o
  {
    return {
      'type': 'statement',
      'variant': s,
      'format': t,
      'target': q,
      'condition': i
    };
  }

drop_start
  = s:( DROP ) e
  { return _.key(s); }

drop_types
  = t:( TABLE / INDEX / TRIGGER / VIEW ) e
  { return _.key(t); }

drop_ie
  = i:( IF ) e e:( EXISTS ) e
  { return _.key(_.compose([i, e])); }

/* Naming rules */

/* TODO: Replace me! */
name_char
  = [a-z0-9\-\_]i

name_char_quoted
  = [a-z0-9\-\_ ]i

name
  = name_bracketed
  / name_backticked
  / name_dblquoted
  / name_unquoted

reserved_nodes
  = ( datatype_types / reserved_words ) !name_char

name_unquoted
  = !reserved_nodes n:( name_char )+
  { return _.textNode(n); }

/** @note Non-standard legacy format */
name_bracketed
  = sym_bopen n:( !sym_bclose name_char_quoted )+ o sym_bclose
  { return _.textNode(n); }

name_dblquoted
  = '"' n:( !'"' name_char_quoted )+ '"'
  { return _.textNode(n); }

/** @note Non-standard legacy format */
name_backticked
  = '`' n:( !'`' name_char_quoted )+ '`'
  { return _.textNode(n); }

/* Symbols */

sym_bopen "Open Bracket"
  = s:( "[" ) o { return _.textNode(s); }
sym_bclose "Close Bracket"
  = s:( "]" ) o { return _.textNode(s); }
sym_popen "Open Parenthesis"
  = s:( "(" ) o { return _.textNode(s); }
sym_pclose "Close Parenthesis"
  = s:( ")" ) o { return _.textNode(s); }
sym_comma "Comma"
  = s:( "," ) o { return _.textNode(s); }
sym_dot "Period"
  = s:( "." ) o { return _.textNode(s); }
sym_star "Asterisk"
  = s:( "*" ) o { return _.textNode(s); }
sym_quest "Question Mark"
  = s:( "?" ) o { return _.textNode(s); }
sym_sglquote "Single Quote"
  = s:( "'" ) o { return _.textNode(s); }
sym_dblquote "Double Quote"
  = s:( '"' ) o { return _.textNode(s); }
sym_backtick "Backtick"
  = s:( "`" ) o { return _.textNode(s); }
sym_tilde "Tilde"
  = s:( "~" ) o { return _.textNode(s); }
sym_plus "Plus"
  = s:( "+" ) o { return _.textNode(s); }
sym_minus "Minus"
  = s:( "-" ) o { return _.textNode(s); }
sym_equal "Equal"
  = s:( "=" ) o { return _.textNode(s); }
sym_amp "Ampersand"
  = s:( "&" ) o { return _.textNode(s); }
sym_pipe "Pipe"
  = s:( "|" ) o { return _.textNode(s); }
sym_mod "Modulo"
  = s:( "%" ) o { return _.textNode(s); }
sym_lt "Less Than"
  = s:( "<" ) o { return _.textNode(s); }
sym_gt "Greater Than"
  = s:( ">" ) o { return _.textNode(s); }
sym_excl "Exclamation"
  = s:( "!" ) o { return _.textNode(s); }
sym_semi "Semicolon"
  = s:( ";" ) o { return _.textNode(s); }

/* Keywords */

ABORT "ABORT Keyword"
  = "ABORT"i
ACTION "ACTION Keyword"
  = "ACTION"i
ADD "ADD Keyword"
  = "ADD"i
AFTER "AFTER Keyword"
  = "AFTER"i
ALL "ALL Keyword"
  = "ALL"i
ALTER "ALTER Keyword"
  = "ALTER"i
ANALYZE "ANALYZE Keyword"
  = "ANALYZE"i
AND "AND Keyword"
  = "AND"i
AS "AS Keyword"
  = "AS"i
ASC "ASC Keyword"
  = "ASC"i
ATTACH "ATTACH Keyword"
  = "ATTACH"i
AUTOINCREMENT "AUTOINCREMENT Keyword"
  = "AUTOINCREMENT"i
BEFORE "BEFORE Keyword"
  = "BEFORE"i
BEGIN "BEGIN Keyword"
  = "BEGIN"i
BETWEEN "BETWEEN Keyword"
  = "BETWEEN"i
BY "BY Keyword"
  = "BY"i
CASCADE "CASCADE Keyword"
  = "CASCADE"i
CASE "CASE Keyword"
  = "CASE"i
CAST "CAST Keyword"
  = "CAST"i
CHECK "CHECK Keyword"
  = "CHECK"i
COLLATE "COLLATE Keyword"
  = "COLLATE"i
COLUMN "COLUMN Keyword"
  = "COLUMN"i
COMMIT "COMMIT Keyword"
  = "COMMIT"i
CONFLICT "CONFLICT Keyword"
  = "CONFLICT"i
CONSTRAINT "CONSTRAINT Keyword"
  = "CONSTRAINT"i
CREATE "CREATE Keyword"
  = "CREATE"i
CROSS "CROSS Keyword"
  = "CROSS"i
CURRENT_DATE "CURRENT_DATE Keyword"
  = "CURRENT_DATE"i
CURRENT_TIME "CURRENT_TIME Keyword"
  = "CURRENT_TIME"i
CURRENT_TIMESTAMP "CURRENT_TIMESTAMP Keyword"
  = "CURRENT_TIMESTAMP"i
DATABASE "DATABASE Keyword"
  = "DATABASE"i
DEFAULT "DEFAULT Keyword"
  = "DEFAULT"i
DEFERRABLE "DEFERRABLE Keyword"
  = "DEFERRABLE"i
DEFERRED "DEFERRED Keyword"
  = "DEFERRED"i
DELETE "DELETE Keyword"
  = "DELETE"i
DESC "DESC Keyword"
  = "DESC"i
DETACH "DETACH Keyword"
  = "DETACH"i
DISTINCT "DISTINCT Keyword"
  = "DISTINCT"i
DROP "DROP Keyword"
  = "DROP"i
EACH "EACH Keyword"
  = "EACH"i
ELSE "ELSE Keyword"
  = "ELSE"i
END "END Keyword"
  = "END"i
ESCAPE "ESCAPE Keyword"
  = "ESCAPE"i
EXCEPT "EXCEPT Keyword"
  = "EXCEPT"i
EXCLUSIVE "EXCLUSIVE Keyword"
  = "EXCLUSIVE"i
EXISTS "EXISTS Keyword"
  = "EXISTS"i
EXPLAIN "EXPLAIN Keyword"
  = "EXPLAIN"i
FAIL "FAIL Keyword"
  = "FAIL"i
FOR "FOR Keyword"
  = "FOR"i
FOREIGN "FOREIGN Keyword"
  = "FOREIGN"i
FROM "FROM Keyword"
  = "FROM"i
FULL "FULL Keyword"
  = "FULL"i
GLOB "GLOB Keyword"
  = "GLOB"i
GROUP "GROUP Keyword"
  = "GROUP"i
HAVING "HAVING Keyword"
  = "HAVING"i
IF "IF Keyword"
  = "IF"i
IGNORE "IGNORE Keyword"
  = "IGNORE"i
IMMEDIATE "IMMEDIATE Keyword"
  = "IMMEDIATE"i
IN "IN Keyword"
  = "IN"i
INDEX "INDEX Keyword"
  = "INDEX"i
INDEXED "INDEXED Keyword"
  = "INDEXED"i
INITIALLY "INITIALLY Keyword"
  = "INITIALLY"i
INNER "INNER Keyword"
  = "INNER"i
INSERT "INSERT Keyword"
  = "INSERT"i
INSTEAD "INSTEAD Keyword"
  = "INSTEAD"i
INTERSECT "INTERSECT Keyword"
  = "INTERSECT"i
INTO "INTO Keyword"
  = "INTO"i
IS "IS Keyword"
  = "IS"i
ISNULL "ISNULL Keyword"
  = "ISNULL"i
JOIN "JOIN Keyword"
  = "JOIN"i
KEY "KEY Keyword"
  = "KEY"i
LEFT "LEFT Keyword"
  = "LEFT"i
LIKE "LIKE Keyword"
  = "LIKE"i
LIMIT "LIMIT Keyword"
  = "LIMIT"i
MATCH "MATCH Keyword"
  = "MATCH"i
NATURAL "NATURAL Keyword"
  = "NATURAL"i
NO "NO Keyword"
  = "NO"i
NOT "NOT Keyword"
  = "NOT"i
NOTNULL "NOTNULL Keyword"
  = "NOTNULL"i
NULL "NULL Keyword"
  = "NULL"i
OF "OF Keyword"
  = "OF"i
OFFSET "OFFSET Keyword"
  = "OFFSET"i
ON "ON Keyword"
  = "ON"i
OR "OR Keyword"
  = "OR"i
ORDER "ORDER Keyword"
  = "ORDER"i
OUTER "OUTER Keyword"
  = "OUTER"i
PLAN "PLAN Keyword"
  = "PLAN"i
PRAGMA "PRAGMA Keyword"
  = "PRAGMA"i
PRIMARY "PRIMARY Keyword"
  = "PRIMARY"i
QUERY "QUERY Keyword"
  = "QUERY"i
RAISE "RAISE Keyword"
  = "RAISE"i
RECURSIVE "RECURSIVE Keyword"
  = "RECURSIVE"i
REFERENCES "REFERENCES Keyword"
  = "REFERENCES"i
REGEXP "REGEXP Keyword"
  = "REGEXP"i
REINDEX "REINDEX Keyword"
  = "REINDEX"i
RELEASE "RELEASE Keyword"
  = "RELEASE"i
RENAME "RENAME Keyword"
  = "RENAME"i
REPLACE "REPLACE Keyword"
  = "REPLACE"i
RESTRICT "RESTRICT Keyword"
  = "RESTRICT"i
RIGHT "RIGHT Keyword"
  = "RIGHT"i
ROLLBACK "ROLLBACK Keyword"
  = "ROLLBACK"i
ROW "ROW Keyword"
  = "ROW"i
ROWID "ROWID Keyword"
  = "ROWID"i
SAVEPOINT "SAVEPOINT Keyword"
  = "SAVEPOINT"i
SELECT "SELECT Keyword"
  = "SELECT"i
SET "SET Keyword"
  = "SET"i
TABLE "TABLE Keyword"
  = "TABLE"i
TEMP "TEMP Keyword"
  = "TEMP"i
TEMPORARY "TEMPORARY Keyword"
  = "TEMPORARY"i
THEN "THEN Keyword"
  = "THEN"i
TO "TO Keyword"
  = "TO"i
TRANSACTION "TRANSACTION Keyword"
  = "TRANSACTION"i
TRIGGER "TRIGGER Keyword"
  = "TRIGGER"i
UNION "UNION Keyword"
  = "UNION"i
UNIQUE "UNIQUE Keyword"
  = "UNIQUE"i
UPDATE "UPDATE Keyword"
  = "UPDATE"i
USING "USING Keyword"
  = "USING"i
VACUUM "VACUUM Keyword"
  = "VACUUM"i
VALUES "VALUES Keyword"
  = "VALUES"i
VIEW "VIEW Keyword"
  = "VIEW"i
VIRTUAL "VIRTUAL Keyword"
  = "VIRTUAL"i
WHEN "WHEN Keyword"
  = "WHEN"i
WHERE "WHERE Keyword"
  = "WHERE"i
WITH "WITH Keyword"
  = "WITH"i
WITHOUT "WITHOUT Keyword"
  = "WITHOUT"i

reserved_words
  = r:( ABORT / ACTION / ADD / AFTER / ALL / ALTER / ANALYZE / AND / AS / ASC /
    ATTACH / AUTOINCREMENT / BEFORE / BEGIN / BETWEEN / BY / CASCADE / CASE /
    CAST / CHECK / COLLATE / COLUMN / COMMIT / CONFLICT / CONSTRAINT / CREATE /
    CROSS / CURRENT_DATE / CURRENT_TIME / CURRENT_TIMESTAMP / DATABASE / DEFAULT /
    DEFERRABLE / DEFERRED / DELETE / DESC / DETACH / DISTINCT / DROP / EACH /
    ELSE / END / ESCAPE / EXCEPT / EXCLUSIVE / EXISTS / EXPLAIN / FAIL / FOR /
    FOREIGN / FROM / FULL / GLOB / GROUP / HAVING / IGNORE / IMMEDIATE /
    INDEX / INDEXED / INITIALLY / INNER / INSERT / INSTEAD / INTERSECT / INTO /
    ISNULL / JOIN / KEY / LEFT / LIKE / LIMIT / MATCH / NATURAL / NOT /
    NOTNULL / NULL / OFFSET / ORDER / OUTER / PLAN / PRAGMA /
    PRIMARY / QUERY / RAISE / RECURSIVE / REFERENCES / REGEXP / REINDEX /
    RELEASE / RENAME / REPLACE / RESTRICT / RIGHT / ROLLBACK / ROW / SAVEPOINT /
    SELECT / SET / TABLE / TEMP / TEMPORARY / THEN / TO / TRANSACTION / TRIGGER /
    UNION / UNIQUE / UPDATE / USING / VACUUM / VALUES / VIEW / VIRTUAL / WHEN /
    WHERE / WITH / WITHOUT / IN / IS / OF / ON / OR / IF / NO ) { return _.key(r); }

/* Generic rules */

any "Anything"
  = .

o "Optional Whitespace"
  = _*

e "Enforced Whitespace"
  = _+

_ "Whitespace"
  = [ \f\n\r\t\v]

/* TODO: Everything with this symbol */
_TODO_
  = "__TODO__"
