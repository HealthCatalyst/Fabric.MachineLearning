---
uid: prepare-to-install.md
title: Prepare to install
---

## Server Specs

- Linux VM with centOS

- 16 GB of RAM

- 40 GB of storage space 

- 4 cores

## Install docker

- Installs and configures docker

    ```curl -sSL https://healthcatalyst.github.io/InstallScripts/installdocker.txt | sh```

- Logout and Run 

    ```curl -sSL https://healthcatalyst.github.io/InstallScripts/setupdocker.txt | sh```

- Install the Machine Learning docker and add the machine to the specified domain

    ```curl -sSL https://healthcatalyst.github.io/InstallScripts/installmachinelearning.txt | sh -s <username> <domain>```

- To run the script setupkeytab.sh inside the container

    ```docker exec fabric.machinelearning opt/install/setupkeytab.sh $username $domain $password```

- Check for SQL connectivity where $servername is a full name to a sql server in the domain. Assumes username has permission to access.

    ```docker exec fabric.machinelearning opt/install/testsql.sh $servername```

- Connect to the shell inside the container

    ```docker exec -it fabric.machinelearning bash```

- Connect to R.

    ```R```

## Test that the install worked and that the proper permissions are in place.
- The following commands are done in R on the command line in the machine, or in your SQL database.
- Load libraries. 

    ```R 
    library(RODBC)
    library(healthcareai)
    ```

- Create a connection string. Replace the server name and database name with the server and database you will be using.

    ```R
    con <- RODBC::odbcDriverConnect('driver={ODBC Driver 13 for SQL Server};
                                     server=HCS-DEV0011.hqcatalyst.local;
                                     database=SAM;
                                     trusted_connection=Yes'
    ``` 
- Create a query to pull from the database. An example would be:

    ```R
    query <- "SELECT[PatientEncounterID],
    [SystolicBPNBR],
    [LDLNBR],
    [A1CNBR],
    [GenderFLG],
    [ThirtyDayReadmitFLG]
    FROM [SAM].[dbo].[HCRDiabetesClinical]"
    ```
- Check if R will pull data from SQL using the connection and query.

    ```R
    df <- RODBC::sqlQuery(con, query)
    head(df)
    ```
- Now, check if R can write to the database/machine while also checking the installation of healthcareai. First create a table in the SQL databse you are using.


    ```SQL
    CREATE TABLE [dbo].[HCRDeployClassificationBASE](
	[BindingID] [int] NULL,
	[BindingNM] [varchar](255) NULL,
	[LastLoadDTS] [datetime2](7) NULL,
	[PatientEncounterID] [decimal](38, 0) NULL,
	[PredictedProbNBR] [decimal](38, 2) NULL,
	[Factor1TXT] [varchar](255) NULL,
	[Factor2TXT] [varchar](255) NULL,
	[Factor3TXT] [varchar](255) NULL
    )
    ```

- Load some data to use to generate predictions. This data comes from the healthcareai installation.

    ```R
    csvfile <- system.file("extdata","HCRDiabetesClinical.csv", package = "healthcareai")

    df <- read.csv(file = csvfile,
               header = TRUE,
               na.strings = c("NULL", "NA", ""))
    ```

- Develop and Deploy a Random Forest model

    ```R
    # Save a dataframe for validation later on
    dfDeploy <- df[951:1000,]

    ## 2. Train and save the model using DEVELOP
    print('Historical, development data:')
    str(df)

    set.seed(42)
    p <- SupervisedModelDevelopmentParams$new()
    p$df <- df
    p$type <- "classification"
    p$impute <- TRUE
    p$grainCol <- "PatientEncounterID"
    p$predictedCol <- "ThirtyDayReadmitFLG"
    p$debug <- FALSE
    p$cores <- 1

    # Run RandomForest
    RandomForest <- RandomForestDevelopment$new(p)
    RandomForest$run()

    ## 3. Load saved model and use DEPLOY to generate predictions.
    print('Fake production data:')
    str(dfDeploy)

    p2 <- SupervisedModelDeploymentParams$new()
    p2$type <- "classification"
    p2$df <- dfDeploy
    p2$grainCol <- "PatientEncounterID"
    p2$predictedCol <- "ThirtyDayReadmitFLG"
    p2$impute <- TRUE
    p2$debug <- FALSE
    p2$cores <- 1

    dL <- RandomForestDeployment$new(p2)
    dL$deploy()

    dfOut <- dL$getOutDf()
    head(dfOut)
    ```
- Write dfOut to the SQL table.

    ```R
    RODBC::sqlSave(con, dfOut, "dbo.HCRDeployClassificationBASE", append = TRUE,
               rownames = FALSE)
    ```

- Check your SQL table to make sure it wrote properly.




