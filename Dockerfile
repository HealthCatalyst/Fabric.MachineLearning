FROM centos:centos6
MAINTAINER The CentOS Project <cloud-ops@centos.org>

RUN yum -y update; yum clean all
RUN yum -y install epel-release; yum clean all

RUN yum -y install R; yum clean all

RUN R --version

#install node.js v6
# RUN curl https://raw.githubusercontent.com/creationix/nvm/v0.25.0/install.sh | bash

ENV NVM_DIR /usr/local/nvm

# Install nvm with node and npm
ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 6.10.1

# Install nvm with node and npm
RUN curl https://raw.githubusercontent.com/creationix/nvm/v0.33.1/install.sh | bash \
    && source $NVM_DIR/nvm.sh \
    && nvm --version \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

RUN node --version

# add our project
ADD . /src

RUN cd /src; npm install

RUN mkdir -p /usr/local/R

ADD ex-sync.R /usr/local/R/
ADD ex-async.R /usr/local/R/
ADD r-script-master/example/simple.R /usr/local/R/

EXPOSE 8080

CMD ["node", "/src/server.js"]