#!/usr/bin/env node

var util = require('util')
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
var PROFILE_RE = /# <hosts2 profile=".*">[\s\S]*# <\/hosts2>/g

// hosts profile tempalte string
var PROFILE_TPL = ([LINE_FEED, '# <hosts2 profile="$PROFILE_NAME">', '$PROFILE_CONTENT', '# </hosts2>']).join(LINE_FEED)

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

    // get profiles information, return {profileName: profileContent, ...}
    get: function(profiles) {

        var i = 0
        var profilePath = ''
        var profileName = ''
        var returnObject = {}

        if (util.isArray(profiles) && profiles.length) {
            for (i = 0; i < profiles.length; ++i) {
                profileName = profiles[i]
                profilePath = path.resolve(PROFILES_DIR, profileName)

                returnObject[profileName] = fs.existsSync(profilePath) ? fs.readFileSync(profilePath, 'utf8').trim() : 'profile not exists!'
            }

            return returnObject
        } else {
            var profiles = fs.readdirSync(PROFILES_DIR)

            if (profiles.length) {
                for (i = 0; i <profiles.length; ++i) {
                    profileName = profiles[i]
                    profilePath = path.resolve(PROFILES_DIR, profileName)
                    returnObject[profileName] = fs.readFileSync(profilePath, 'utf8').trim()
                }

                return returnObject
            } else {
                return null; // no profiles exist
            }
        }
    },

    // remove profile
    remove: function(profileName) {
        var profilePath = path.resolve(PROFILES_DIR, profileName)

        if (fs.existsSync(profilePath)) {
            fs.unlinkSync(profilePath)
        }
    },

    // switch on hosts profiles
    on: function(profiles) {
        var profileArray = []
        var profilePath = ''

        if (!profiles.length) {
            throw 'no profile provided!'
        }

        profiles.map(function(profile) {
            profilePath = path.resolve(PROFILES_DIR, profile)

            // if the profile file doesn't exist
            if (!fs.existsSync(profilePath)) {
                throw 'profile [' + profile + '] does not exist!'
            }

            // new profile records string
            profileArray.push(PROFILE_TPL
                .replace('$PROFILE_NAME', profile)
                .replace('$PROFILE_CONTENT', fs.readFileSync(profilePath, 'utf8').trim()))
        })

        this.reset()
        fs.appendFileSync(HOSTS_FILE_PATH, profileArray.join(LINE_FEED), 'utf8')
        this.flushDNS()
    },

    // clear hosts added by <hosts2>
    reset: function() {
        var hostsStr = fs.readFileSync(HOSTS_FILE_PATH, 'utf8').replace(PROFILE_RE, '').trimRight();
        fs.writeFileSync(HOSTS_FILE_PATH, hostsStr)
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
            throw 'DNS Flush: un-supported OS platform'
        }
    }
};

module.exports = hosts2