# Fabric.MachineLearning

Pre-requisites:
1. Docker
  a.	Windows: https://docs.docker.com/docker-for-windows/install/ 
  b.	Mac: https://docs.docker.com/docker-for-mac/install/ 

To build the docker:
docker build -t fabric.machinelearning .

To run the docker:
docker run -d -p 8080:8080 --name fabric.machinelearning fabric.machinelearning
