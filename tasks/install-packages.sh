#!/bin/bash

printf "Waiting for Verdaccio"

until curl --output /dev/null --silent --head --fail http://172.30.20.18:4873; do
    printf "."
    sleep 1s
done

printf "\n"

source ./check-registry-config.sh

if ! checkRegistryConfig; then
  exit 12
fi

PACKAGES_DIR=$(pwd)/packages

local_packages=()

echo "Packages directory set: $PACKAGES_DIR"

# Checks if a `package.json` file exists in `$1/$2`.
#
# @param {string} baseDir The base directory
# @param {string} packageDir The name of the package
# @return {boolean} Whether or not package.json is discovered.
function isPackage() {
  local baseDir
  baseDir=$1
  local package_dir
  package_dir=$2

  test -f "$baseDir/$package_dir/package.json"
}

function buildAndPublish() {
  local prevPWD
  local package
  local pkgAbsoluteDir

  prevPWD=$(pwd)
  package=$1
  pkgAbsoluteDir="$PACKAGES_DIR/$package"

  echo "$pkgAbsoluteDir"

  cd "$pkgAbsoluteDir" || exit 1

  echo "unpublishing previous versions of $package from Verdaccio"
  # Unpublish previous version of package, which may have persisted on Verdaccio
  npm unpublish --registry http://172.30.20.18:4873 --force

  echo "yarn install"
  yarn install

  echo "yarn build"
  yarn build

  echo "publishing $package to Verdaccio"
  npm publish --tag dev --registry http://172.30.20.18:4873 --verbose

  cd "$prevPWD" || exit 1
}

function getPackages() {
  local prevPWD
  prevPWD=$(pwd)

  echo "prevPWD=$prevPWD"

  cd "$PACKAGES_DIR" || exit 1

  for package in *; do
    if [ -d "$package" ]; then
      if isPackage "$(pwd)" "$package"; then
        local_packages+=("$package")
      fi
    fi
  done

  cd "$prevPWD" || exit 1
}

getPackages

for package in "${local_packages[@]}"; do
  echo "Building and Publishing $package to Verdaccio"

  buildAndPublish "$package"
done


# Sleep gives us time to open an interactive shell. This should be removed when
# opening an interactive shell is no longer required. TODO: Remove sleep time
# when no longer required for development.
POST_INSTALL_SLEEP_TIME="1s"

echo "finished, sleeping now for $POST_INSTALL_SLEEP_TIME"

sleep $POST_INSTALL_SLEEP_TIME
