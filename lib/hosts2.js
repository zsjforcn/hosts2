#!/usr/bin/env node

var fs = require('fs')
var path = require('path')

// OS platform string
var PLATFORM = process.platform

// OS host file path
var HOSTS_FILE_PATH = ({
    'darwin': '/private/etc/hosts',
    'linux': '/etc/hosts',
    'win32': process.env['WinDir'] + '/System32/drivers/etc/hosts'
})[PLATFORM]

// OS platform line feed
var LINE_FEED = ({
    'darwin': '\n',
    'linux': '\n',
    'win32': '\r\n'
})[PLATFORM]

// default path to store <hosts2> profiles
var PROFILES_DIR = path.resolve((PLATFORM == 'win32' ? process.env['HOMEPATH'] : process.env['HOME']), '.hosts2_profiles')

if (!fs.existsSync(PROFILES_DIR)) {
    fs.mkdirSync(PROFILES_DIR)
}

// hosts profile reg expression, global match
var PROFILE_RE = /# <hosts2>[\s\S]*# <\/hosts2>/g

// hosts profile tempalte string
var PROFILE_TPL = ([LINE_FEED, '# <hosts2>', '$HOSTS_PROFILE', '# </hosts2>']).join(LINE_FEED)

var hosts2 = {
    // add profile
    add: function(profileName, hostsStr) {
        var profilePath = path.resolve(PROFILES_DIR, profileName)
        
        hostsStr = hostsStr || ''

        hostsStr = hostsStr.split(',').map(function(item) {
            return item.trim()
        }).join(LINE_FEED)

        hostsStr = hostsStr && (LINE_FEED + hostsStr)

        if (!fs.existsSync(profilePath)) {
            fs.writeFileSync(profilePath, hostsStr, 'utf8')
        } else {
            fs.appendFileSync(profilePath, hostsStr, 'utf8')
        }
    },

    // remove profile
    remove: function(profileName) {
        var profilePath = path.resolve(PROFILES_DIR, profileName)

        if (fs.existsSync(profilePath)) {
            fs.unlinkSync(profilePath)
        }
    },

    // switch on a specific hosts profile
    on: function(profileName) {
        var profileStr = ''
        var profilePath = path.resolve(PROFILES_DIR, profileName)

        try {
            // if the profile file doesn't exist
            if (!fs.existsSync(profilePath)) {
                throw 'the profile does not exist'
            }

            // new profile records string
            profileStr = fs.readFileSync(profilePath, 'utf8').trim()

            this.reset()
            fs.appendFileSync(HOSTS_FILE_PATH, PROFILE_TPL.replace('$HOSTS_PROFILE', profileStr), 'utf8')
            this.flushDNS()
        } catch(e) {
            console.error(e)
        }        
    },

    // clear hosts added by <hosts2>
    reset: function() {
        try {
            var hostsStr = fs.readFileSync(HOSTS_FILE_PATH, 'utf8').replace(PROFILE_RE, '').trimRight();
            fs.writeFileSync(HOSTS_FILE_PATH, hostsStr)
        } catch(e) {
            console.error(e)
        }
    },

    // flush DNS cache
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