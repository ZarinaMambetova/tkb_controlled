const { src, dest, task, series, watch, parallel } = require('gulp');
const rm = require('gulp-rm'); // Подключили пакет: Удаление папки dist. Установка: npm install --save-dev gulp-rm
const sass = require('gulp-sass'); // Подключили пакет: компиляция sass-файлов. Установка: npm install gulp-sass node-sass --save-dev
const concat = require('gulp-concat'); // Подключили пакет: "Склеивание" файлов. Установка: npm install --save-dev gulp-concat

const browserSync = require('browser-sync').create(); // Подключили пакет: Создание сервера. Установка: npm install browser-sync -save-dev
const reload = browserSync.reload; // Сам перезагружает сервер, если есть изменения

const sassGlob = require('gulp-sass-glob'); // Подключили пакет: упрощение подключения всех файлов стилей одной строкой @import "./layout/*.scss";. Установка: npm install gulp-sass-glob --save-dev
const  autoprefixer = require('gulp-autoprefixer'); // Подключаем пакет autoprefixer для свойств под разные браузеры. Установка: npm install --save-dev gulp-autoprefixer
const cleanCSS = require('gulp-clean-css'); // Подключили пакет: для минимизации файла стилей. Установка:  npm install gulp-clean-css --save-dev
const sourcemaps = require('gulp-sourcemaps'); // Подключили пакет: для карты файлов в панели разработчика. Установка: npm i gulp-sourcemaps --save-dev

const px2rem = require('gulp-px-to-rem'); // Переводит в ремы пиксели для адаптива. Установка:  npm i --save-dev  gulp-smile-px2rem
const gcmq = require('gulp-group-css-media-queries'); // Подключили пакет: группировка медиа-запросов для минимизации файла стилей. Установка: npm install --save-dev gulp-group-css-media-queries

const babel = require('gulp-babel'); // Подключили пакет: преобразовываем js-код для старых браузеров. Установка:  npm i gulp-sourcemaps --save-dev
const uglify = require('gulp-uglify'); // Подключили пакет: для минимизации файла со скриптами. Установка:  npm install --save-dev gulp-uglify

const svgo = require('gulp-svgo'); // Подключили пакет: оптимизация XML-кода в SVG 
const svgSprite = require('gulp-svg-sprite'); // Подключили пакет: создание спрайтов SVG. Установка с предыдущим пакетом: npm i gulp-svgo gulp-svg-sprite --save-dev

const  gulpif = require('gulp-if');// Подключили пакет: разделения, когда какие пакеты должны срабатывать (dev & prod). Установка: npm i gulp-if --save-dev
const env = process.env.NODE_ENV; // установили cross-env для корректной работы во всех системах (ос, линуkc, вин). Установка: npm i cross-env  --save-dev Внесли изменения в файл package.json

const {DIST_PATH, SRC_PATH, STYLES_LIBS, JS_LIBS} = require('./gulp.config'); // подключили файл gulp.config.js

sass.compiler = require('node-sass'); // обязательно указываем компилятор на ноде

// npm run gulp clean - Удаление папки dist и всего ее содержимого, если меняются исходники. При пересборке проекта
task( 'clean', () => {
  return src( `${DIST_PATH}/**/*`, { read: false }).pipe( rm() )
});

// npm run gulp copy - Копируем содержимое с расширением .html в папку dist
// После копирования перезагружается сервер внутри потока
task( 'copy:html', () => {
  return src( `${SRC_PATH}/*.html` )
  .pipe(dest(DIST_PATH))
  .pipe(reload({stream: true}));

});

// Копируем фото
task( 'copy:images', () => {
  return src( `${SRC_PATH}/images/pic/**/*.*`)
  .pipe(dest(`${DIST_PATH}/images/pic`))
  .pipe(reload({stream: true}));

});


// Копируем шрифты
task( 'copy:fonts', () => {
  return src( `${SRC_PATH}/fonts/*.*`)
  .pipe(dest(`${DIST_PATH}/fonts`))
  .pipe(reload({stream: true}));

});

// Далее: npm run gulp styles - Запускает таск по обработке файлов стилей. Следим за  файлами стилей,
// gulpif указывает, какой пакет должен сработать только для стадии разработки, а какой на продакшн
// 1 Инициализация карты файлов
// 2 Склеиваем в один файл содержимое массива
// 3 sassGlob собирает все содержимое папки layout в main  
// 4 Обработка sass-ом. Добавили предупреждение об ошибке
// 5 Переводит в ремы пиксели 
// 6 Автопрефиксы работают с css-файлами, поэтому подключаем после компиляции
// 7  группировка медиа-запросов (после компиляции)
// 8 минимизируем файл (пробелы, комменты и пр.). Файл весит меньше
// 9 запись сорсмапов
// 10 собираем всё в dist
// 11 Перезагрузка сервера
task( 'styles', () => {
  return src([...STYLES_LIBS, `${SRC_PATH}/styles/main.scss`])
    .pipe(gulpif(env === "dev", sourcemaps.init()))
    .pipe(concat('main.min.scss'))
    .pipe(sassGlob())
    .pipe(sass().on('error', sass.logError))
    .pipe(px2rem()) // раскомментить перед build
    .pipe(gulpif(env === "dev", autoprefixer({cascade: false})))
    .pipe(gulpif(env === "prod", gcmq()))
    .pipe(gulpif(env === "prod", cleanCSS({compatibility: 'ie8'})))
    .pipe(gulpif(env === "dev", sourcemaps.write()))
    .pipe(dest(DIST_PATH))
    .pipe(reload({stream: true}));
});

// Далее: npm run gulp scripts - Запускает таск по обработке файлов js.
// 1 Инициализация карты файлов
// 2 Склеиваем в один файл 
// 3преобразовываем синтаксис в понятный всем браузерам
// 4 Минимизируем код
// 5 запись сорсмапов
// 6 собираем всё в dist
// 7 Перезагрузка сервера
task( 'scripts', () => {
  return src([...JS_LIBS, `${SRC_PATH}/scripts/*.js`])
    .pipe(gulpif(env === "dev", sourcemaps.init()))
    .pipe(concat('main.min.js', { newLine: ";"}))
    .pipe(gulpif(env === "dev", babel({
      presets: ['@babel/env']
  })))
    .pipe(gulpif(env === "dev", uglify()))
    .pipe(sourcemaps.write())
    .pipe(dest(DIST_PATH))
    .pipe(reload({stream: true}));
});

// Работа с SVG:
// 1 убираем все лишние атрибуты в файлах 
// 2 собираем спрайт
// 3 отправляем в папку dist
task( 'icons', () => {
  return src( `${SRC_PATH}/images/icons/*.svg` )
    .pipe(svgo(
    //   {
    // plugins: [
    //   {
    //     removeAttrs: { attrs: "(style|data.*)"}
    //   }
    // ]
    //   }
      // скрыла, чтобы свг не менялись в спрайте. Они отображаются черными полностью
    ))
    .pipe(svgSprite({
      mode: {
        symbol: {
          sprite: "../sprite.svg"
        }
      }
    }))
    .pipe(dest(`${DIST_PATH}/images/icons`))
  });

// Развернем dev-server по папке dist. 
// open: false - Не открывать каждый раз новую вкладку при запуске
task('server', () => {
  browserSync.init({
      server: {
          baseDir: `./${DIST_PATH}`
      },
      open: false
  });
});

// следим за изменеиями в файлах методом watch
task("watch", () => {
  watch('./src/styles/**/*.scss', series('styles'));
  watch('./src/*.html', series('copy:html'));
  watch('./src/scripts/*.js', series('scripts'));
  watch('./src/images/icons/*.*', series('icons'));
  watch('./src/images/pic/**/*.*', series('copy:images'));
});



// npm run gulp - указываем выше все таски и одной командой запускаем серию тасков в терминале
// Указываем, какие таски должны сработать параллельно
task(
  'default', 
  series(
    'clean', 
    parallel('copy:html', 'copy:images', 'copy:fonts', 'styles', 'scripts', 'icons'), 
    parallel('watch', 'server')
    )
  );

  //npm run build - собираем готовый оптимизированный, минимизированный  проект
  task(
    'build', 
    series('clean', 
      parallel('copy:html', 'copy:images', 'copy:fonts', 'styles', 'scripts', 'icons'))
    );