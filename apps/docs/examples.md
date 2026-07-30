# Examples

## Named sheets

Add an HTML comment `<!-- name -->` immediately before a table to name its
sheet. Without one, tables are named `Sheet0`, `Sheet1`, … in document order.

<!-- table1 -->
| name           | formula           | values                 |
| -------------- | ----------------- | ---------------------- |
| three          | –                 | 3                      |
| eight          | –                 | 8                      |
| summation      | `#SUM(C1:C2)`     | [?](#SUM(C1:C2))       |
| multiplication | `#C1*C2`          | [?](#C1*C2)            |
| average        | `#AVERAGE(C1:C2)` | [?](#AVERAGE(C1:C2))   |

## Referencing another table

Use `SheetName!Cell` to pull a value from a different table. The table below
reads `C3` from **table1** above.

<!-- table2 -->
| name                  | values1           | values2                   |
| --------------------- | ----------------- | ------------------------- |
| six and one           | 6                 | 1                         |
| summation from table1 | 4                 | [?](#table1!C3)           |
| count larger than 3   | [?](#COUNTIF(B1:B2,">3")) | [?](#COUNTIF(C1:C2,">3")) |

## Functions and errors

HyperFormula supports [hundreds of functions](https://hyperformula.handsontable.com/guide/built-in-functions.html).
Errors surface as spreadsheet error codes.

<!-- misc -->
| what              | result                     |
| ----------------- | -------------------------- |
| 10                | 10                         |
| 0                 | 0                          |
| division by zero  | [?](#B1/B2)                |
| rounded pi        | [?](#ROUND(PI(),3))        |
| conditional       | [?](#IF(B1>B2,"bigger","smaller")) |
