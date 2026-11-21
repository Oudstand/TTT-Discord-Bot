#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

if [[ ! -x ./ttt-discord-bot-linux ]]; then
    printf 'The executable ttt-discord-bot-linux must be next to this script.\n' >&2
    exit 1
fi

loopback_addresses=$(ip -4 -o address show dev lo to 192.178.0.1/32)
if [[ -z "$loopback_addresses" ]]; then
    sudo ip address replace 192.178.0.1/32 dev lo
fi

exec ./ttt-discord-bot-linux "$@"
