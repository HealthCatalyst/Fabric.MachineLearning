library(RODBC)

args = commandArgs(trailingOnly=TRUE)

print("Hello world")

sql<-c("SELECT * FROM master.Information_Schema.Tables")
tryCatch({
  ch<-odbcDriverConnect("driver=ODBC Driver 13 for SQL Server;server="+ args[1]+";Database=master;Trusted_Connection=yes")

  res<-sqlQuery(ch,sql)
  print("success")
  },error = function(e) {
  print(e)
    print(odbcGetErrMsg(ch))
      print("error")
  })
  
head(res)
  
odbcClose(ch)