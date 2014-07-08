var task = {
    options: {
        reporter: '<%= grunt.option("mocha") || "spec" %>',
        timeout: '<%= grunt.option("timeout") || 2000 %>'
    },
    UnitTests:{
        src: ['tests/*.js']
    }
};

module.exports = task;