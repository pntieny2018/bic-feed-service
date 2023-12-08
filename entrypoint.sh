#!/bin/sh

# Run any command before run application here

# shellcheck disable=SC2039
if [ "${1:0:1}" = '-' ]; then
  set -- /sbin/tini -- node "$@"
elif [ "$1" = 'node' ]; then
  set -- /sbin/tini -- "$@"
fi

exec "$@"
