-- original: tkt2339.test
-- credit:   http://www.sqlite.org/src/tree?ci=trunk&name=test

create table t1(num int);
    insert into t1 values (1);
    insert into t1 values (2);
    insert into t1 values (3);
    insert into t1 values (4);
    
    create table t2(num int);
    insert into t2 values (11);
    insert into t2 values (12);
    insert into t2 values (13);
    insert into t2 values (14);
    
    SELECT * FROM (SELECT * FROM t1 ORDER BY num DESC LIMIT 2)
    UNION
    SELECT * FROM (SELECT * FROM t2 ORDER BY num DESC LIMIT 2)
;SELECT * FROM (SELECT * FROM t1 ORDER BY num DESC LIMIT 2)
    UNION ALL
    SELECT * FROM (SELECT * FROM t2 ORDER BY num DESC LIMIT 2)
;SELECT * FROM (SELECT * FROM t1 ORDER BY num DESC)
    UNION ALL
    SELECT * FROM (SELECT * FROM t2 ORDER BY num DESC LIMIT 2)
;SELECT * FROM (SELECT * FROM t1 ORDER BY num DESC LIMIT 2)
    UNION ALL
    SELECT * FROM (SELECT * FROM t2 ORDER BY num DESC)
;SELECT * FROM (SELECT * FROM t1 ORDER BY num DESC LIMIT 2)
    UNION
    SELECT * FROM (SELECT * FROM t2 ORDER BY num DESC)
;SELECT * FROM (SELECT * FROM t1 ORDER BY num DESC LIMIT 2)
    EXCEPT
    SELECT * FROM (SELECT * FROM t2 ORDER BY num DESC)
;SELECT * FROM (SELECT * FROM t1 LIMIT 2)
    UNION
    SELECT * FROM (SELECT * FROM t2 ORDER BY num DESC LIMIT 2)
;SELECT * FROM (SELECT * FROM t1 LIMIT 2)
    UNION
    SELECT * FROM (SELECT * FROM t2 LIMIT 2)
;SELECT * FROM (SELECT * FROM t1 ORDER BY num DESC LIMIT 2)
    UNION
    SELECT * FROM (SELECT * FROM t2 LIMIT 2);