var shell = require('shelljs');
'use strict';

module.exports = function(grunt){

    grunt.initConfig({
        jshint: {
            all: [
                'Gruntfile.js',
                'src/**/*.js'
            ],
            options: {
                jshintrc: '.jshint'
            }
        },
        mochaTest:{
            options: {
                reporter: 'spec'
            },
            tests:{
                src: ['tests/*.js']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.registerTask('default', 'dev');
    grunt.registerTask('dev', ['jshint', 'mochaTest']);
    grunt.registerTask('test', ['mochaTest']);

    grunt.registerTask('vagrant-up', function(){ shell.exec('vagrant up'); });
    grunt.registerTask('vagrant-destroy', function(){ shell.exec('vagrant destroy -f'); });
    grunt.registerTask('vagrant-test', [ 'mochaTest' ]);
    grunt.registerTask('vagrant', ['vagrant-up', 'vagrant-test', 'vagrant-destroy']);

}