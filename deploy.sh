#!/bin/bash

sshpass -f <(printf '%s\n' 930920) scp embed/*  root@172.16.58.11:/home/web/
