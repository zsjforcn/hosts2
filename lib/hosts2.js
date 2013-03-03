#!/usr/bin/env node

var fs = require('fs')
var path = require('path')

// OS platform
var PLATFORM = process.platform

// OS host file object
var HOSTS_FILE_PATH = ({
    'darwin': '/private/etc/hosts',
    'win32': process.env['WinDir'] + 'System32/drivers/etc/hosts',
    'linux': '/etc/hosts'
})[PLATFORM]

// <hosts2> hosts profile directory path
var PROFILES_DIR = path.resolve('./profiles')

var hosts2 = {

    // hosts profile reg expression, global match
    PROFILE_RE: /# <hosts2>[\s\S]*# <\/hosts2>/,

    PROFILE_TPL:
        '\n\n' +
        '# <hosts2>\n' +
        '$HOSTS_PROFILE\n' +
        '# </hosts2>',

    // switch on the specific hosts profile
    on: function(profile) {
        var profileStr = ''
        var profilePath = PROFILES_DIR + '/' + profile

        try {
            // if the profile file doesn't exist
            if (!fs.existsSync(profilePath)) {
                throw 'the specified profile does not exist'
            }

            // new profile records string
            profileStr = fs.readFileSync(profilePath, 'utf8').trim()

            this.reset()
            fs.appendFileSync(HOSTS_FILE_PATH, this.PROFILE_TPL.replace('$HOSTS_PROFILE', profileStr), 'utf8')
            this.flushDNS()
        } catch(e) {
            console.error(e)
        }        
    },

    // clear hosts added by <hosts2>
    reset: function() {
        try {
            var hostsStr = fs.readFileSync(HOSTS_FILE_PATH, 'utf8').replace(this.PROFILE_RE, '').trimRight();
            fs.writeFileSync(HOSTS_FILE_PATH, hostsStr)
        } catch(e) {
            console.error(e)
        }
    },

    flushDNS: function() {
        var flushCommand = ({
            'darwin': 'dscacheutil -flushcache',
            'win32': 'ipconfig /flushdns',
            'linux': '/etc/rc.d/init.d/nscd restart'
        })[PLATFORM]

        if (flushCommand) {
            require('child_process').exec(flushCommand)
        } else {
            console.error('DNS Flush: un-supported OS platform')
        }
    }
};

module.exports = hosts2