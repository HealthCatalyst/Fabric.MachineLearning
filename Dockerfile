FROM centos:centos6
MAINTAINER Health Catalyst <imran.qureshi@healthcatalyst.com>

## Set a default user. Available via runtime flag `--user docker` 
## Add user to 'staff' group, granting them write privileges to /usr/local/lib/R/site.library
## User should also have & own a home directory (for rstudio or linked volumes to work properly). 
RUN useradd docker \
	&& mkdir -p /home/docker \
	&& chown docker:docker /home/docker \
    && mkdir -p /usr/lib64/R/library \
    && chown docker:docker /usr/lib64/R/library \
    && mkdir -p /usr/share/doc/R-3.3.3/html
 
RUN yum -y update; yum clean all
RUN yum -y install epel-release; yum clean all

RUN chown docker:docker /usr/lib64/R/library 

RUN ls -ld /usr/lib64/R/library

RUN yum -y install R; yum clean all

ADD R.css /usr/share/doc/R-3.3.3/html/

#setup R configs
RUN echo "r <- getOption('repos'); r['CRAN'] <- 'http://cran.us.r-project.org'; options(repos = r); .libPaths('/usr/lib64/R/library')" > ~/.Rprofile
# RUN Rscript -e "install.packages('yhatr')"
RUN Rscript -e "install.packages('ggplot2')"
RUN Rscript -e "install.packages('needs')"
RUN Rscript -e "install.packages('jsonlite')"

# install any other packages here

# add any other R scripts here

# USER docker
# USER root
# RUN R --version

# install python
RUN cd /usr/src \
    && curl -O https://www.python.org/ftp/python/3.5.2/Python-3.5.2.tgz \
    && tar xzf Python-3.5.2.tgz \
    && cd Python-3.5.2 \
    && ./configure \
    && make altinstall \
    && cd .. \
    && rm Python-3.5.2.tgz

RUN python3.5 -V

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

RUN Rscript -e "install.packages('dplyr')"

# add our project
ADD . /src

RUN cd /src; npm install

EXPOSE 8080

RUN mkdir -p /usr/share/fabricml

ADD r-script-master/example/ex-sync.R /usr/share/fabricml
ADD r-script-master/example/ex-async.R /usr/share/fabricml
ADD r-script-master/example/simple.R /usr/share/fabricml

ADD python-script/examples/compute_input.py /usr/share/fabricml

CMD ["node", "/src/server.js"]