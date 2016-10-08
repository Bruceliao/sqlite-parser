-- original: whereK.test
-- credit:   http://www.sqlite.org/src/tree?ci=trunk&name=test

CREATE TABLE t1(a,b,c);
  WITH RECURSIVE c(x) AS (VALUES(0) UNION ALL SELECT x+1 FROM c WHERE x<99)
    INSERT INTO t1(a,b,c) SELECT x, x/10, x%10 FROM c;
  CREATE INDEX t1bc ON t1(b,c);
  SELECT a FROM t1 WHERE b>9 OR b=9 ORDER BY +a
;EXPLAIN QUERY PLAN
  SELECT a FROM t1 WHERE b>9 OR b=9 ORDER BY +a
;SELECT a FROM t1 WHERE b>8 OR (b=8 AND c>7) ORDER BY +a
;EXPLAIN QUERY PLAN
  SELECT a FROM t1 WHERE b>8 OR (b=8 AND c>7) ORDER BY +a
;SELECT a FROM t1 WHERE (b=8 AND c>7) OR b>8 ORDER BY +a
;EXPLAIN QUERY PLAN
  SELECT a FROM t1 WHERE (b=8 AND c>7) OR b>8 ORDER BY +a
;SELECT a FROM t1 WHERE (b=8 AND c>7) OR 8<b ORDER BY +a
;EXPLAIN QUERY PLAN
  SELECT a FROM t1 WHERE (b=8 AND c>7) OR 8<b ORDER BY +a
;SELECT a FROM t1 WHERE (b=8 AND c>7) OR (b>8 AND c NOT IN (4,5,6))
   ORDER BY +a
;EXPLAIN QUERY PLAN
  SELECT a FROM t1 WHERE (b=8 AND c>7) OR (b>8 AND c NOT IN (4,5,6))
   ORDER BY +a;