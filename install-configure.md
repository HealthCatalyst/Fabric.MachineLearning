# Fabric.MachineLearning Docker Installation

This document outlines steps to install the Fabric.MachineLearning Docker container (running Python and R) on a CentOS host machine.

It begins with docker installation. It continues with the installation of Fabric.MachineLearning. It finishes with interactive R work to verify data flow and permissions.

## Requirements

- A docker host
- An MSSQL server for verification

### Docker Host Server Specs

- Linux VM running [CentOS](https://www.centos.org)
- 4 cores
- 16 GB of RAM
- 40 GB of storage space 

## A Few Words About Docker

Docker images are fundamentally immutable. This means that any changes done to or in a running container will not be saved once that container is destroyed. After prototyping is complete, if changes are needed users will need to edit the `DOCKERFILE` and submit a pull request.

### Glossary

- **Docker host**:
    + The machine that runs the docker service and hosts running containers.
- **Dockerfile**:
    + The source file that determines the build process of an image.
- **Docker Image**:
    + The distrubutable immutable artifact.
- **Docker Container**:
    + A running instance of an image. Changes do not persist after destruction.

## Install Docker on a Linux Machine

1. Install Docker
    `curl -sSL https://healthcatalyst.github.io/InstallScripts/installdocker.txt | sh`

2. Logout

3. Start docker service
    `curl -sSL https://healthcatalyst.github.io/InstallScripts/setupdocker.txt | sh`

## Install the Fabric.MachineLearning Docker Image

1. Download and install the **fabric.machinelearning** docker image and authenticate the container to the specified domain.
    `curl -sSL https://healthcatalyst.github.io/InstallScripts/installmachinelearning.txt | sh -s <username> <domain>`

2. Authenticate the container to the domain:
    - `docker exec fabric.machinelearning opt/install/setupkeytab.sh $username $domain $password`
    - For example if your user is **jane.doe** your domain is **healthydata.local** and your password is **supersecret1234**
        + `docker exec fabric.machinelearning opt/install/setupkeytab.sh jane.doe healthydata.local 'supersecret1234'`
`

3. Verify domain authentication:
    - Check for SQL connectivity where $servername is a full name to a sql server in the domain.
        - `docker exec fabric.machinelearning opt/install/testsql.sh $servername`
        - For example, if your server is **hcs-gm0004.hqcatalyst.local** run `docker exec fabric.machinelearning opt/install/testsql.sh hcs-gm0004.hqcatalyst.local`

    - This assumes the given username has access rights.

## Executing R Inside the Container

1. Connect to the running container and use the bash shell
    `docker exec -it fabric.machinelearning bash`

2. Open an R session
    `R`

## Verify R Data Pipeline

These steps verify that you can read and write data from an MSSQL server inside the R environment.

The following commands are done in an R session inside the running container and in your MSSQL database console.

1. Connect to an R session (see above)

2. Load libraries. 
    ```R 
    library(RODBC)
    ```

3. Create a connection string. Replace the **server name** and **database** with your configuration.
    ```R
    con <- RODBC::odbcDriverConnect('driver={ODBC Driver 13 for SQL Server};
                                     server=HCS-DEV0011.hqcatalyst.local;
                                     database=SAM;
                                     trusted_connection=Yes'
    ```

4. Create an SQL query to read data from the database. For example:
    ```R
    query <- "SELECT[PatientEncounterID],
    [SystolicBPNBR],
    [LDLNBR],
    [A1CNBR],
    [GenderFLG],
    [ThirtyDayReadmitFLG]
    FROM [SAM].[dbo].[HCRDiabetesClinical]"
    ```

5. Using the connection and query, attempt to read data from the MSSQL server.
    ```R
    df <- RODBC::sqlQuery(con, query)
    head(df)
    ```

## healthcareai Verification

Verify that R can write to the database while also checking the installation of healthcareai.

1. First create a table in the SQL databse you are using.
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

2. Within an R session, load healthcareai
    ```R
    library(healthcareai)
    ```

3. Load some included sample data to use to generate predictions. This data comes from healthcareai.
    ```R
    csvfile <- system.file("extdata","HCRDiabetesClinical.csv", package = "healthcareai")

    df <- read.csv(file = csvfile,
               header = TRUE,
               na.strings = c("NULL", "NA", ""))
    ```

3. Develop and deploy a random forest model.
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
    
5. Write data to the MSSQL table.
    ```R
    RODBC::sqlSave(con, dfOut, "dbo.HCRDeployClassificationBASE", append = TRUE, rownames = FALSE)
    ```

6. Check your MSSQL table to verify that data was written.




