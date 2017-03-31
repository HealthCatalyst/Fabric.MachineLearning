FROM centos:centos6
MAINTAINER The CentOS Project <cloud-ops@centos.org>

RUN yum -y update; yum clean all
RUN yum -y install epel-release; yum clean all
RUN yum -y install nodejs npm; yum clean all

RUN yum -y install R; yum clean all

RUN R --version
ADD . /src

RUN cd /src; npm install

EXPOSE 8080

CMD ["node", "/src/server.js"]