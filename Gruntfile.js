module.exports = function(grunt){
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    less: {
        options: {
            paths: 'src/less/',
            compress:true
        },
        src: {
            expand: true,
            cwd: 'src/less/',
            src: [
                '*/main.less'
            ],
            ext: '.min.css',
            dest: 'public/css',
            rename  : function (dest, src) {
              var folder    = src.substring(0, src.lastIndexOf('/'));
              var filename  = src.substring(src.lastIndexOf('/'), src.length);

              filename  = filename.substring(0, filename.lastIndexOf('.'));

              return dest + "/" + folder + '.min.css';
            }
        }
    },
    dust: {
      options: {
        helper: "dust",
        dependencies: {
          dust: "dust"
        },
        optimizers: {
          format: function(ctx, node) { return node; }
        }
      },
      build: {
        expand: true,
        cwd: "views",
        src: "**/*.dust",
        dest: "views",
        ext: ".js",
        filter: "isFile"
      }
    },
    uglify : {
      options: {
        //beautify:true
      },
      build : {
        files : {
          'public/js/counter.min.js': 'src/js/counter.js',
          'public/js/timetable.min.js': 'src/js/timetable.js',
          'public/js/vendor.min.js': 'src/js_vendor/*'
        },
      }
    },
    copy: {
      main: {
        files: [
          {
            cwd: 'src/css',
            src: '**/*',
            dest: 'public/css',
            expand: true
          },
          {
            cwd:'src',
            src:'manifest.appcache',
            dest: 'public',
            expand:true
          }
        ],
        options: {
          process: function (content, srcpath) {
            return content.replace('<{!timestamp}>', new Date());
          }
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-dustjs-linkedin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.registerTask('default',['less','dust','uglify','copy']);
  grunt.registerTask('dev',['copy','uglify','less']);
};
