#!/bin/bash

sudo apt-get update
sudo apt install unzip

wget -qO- https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/6.4.3/flyway-commandline-6.4.3-linux-x64.tar.gz | tar xvz && sudo ln -s `pwd`/flyway-6.4.3/flyway /usr/local/bin
