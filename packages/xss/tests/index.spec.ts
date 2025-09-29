/* eslint-disable prettier/prettier */
/* eslint-disable func-names */
/* eslint-disable no-undef */

import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';

import { xss, initSanitize, sanitizeSvg } from '../src';

const sanitize = initSanitize({
  allowedKeys: ['allowedKeys'],
});

describe('Express xss Sanitize', function () {
  describe('Sanitize with default settings as middleware before all routes', function () {
    const app = express();
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(xss());

    app.post('/body', function (req, res) {
      res.status(200).json({
        body: req.body,
      });
    });

    app.post('/headers', function (req, res) {
      res.status(200).json({
        headers: req.headers,
      });
    });

    app.get('/query', function (req, res) {
      res.status(200).json({
        query: req.query,
      });
    });

    describe('Sanitize some text & object', function () {
      it('should sanitize simple string.', function (done) {
        expect(sanitize('<script>alert("XSS")</script>')).toEqual('');
        expect(sanitize('<&gagaga')).toEqual('<&gagaga');
        expect(sanitize('`我饿了` 你呢')).toEqual('`我饿了` 你呢');
        expect(sanitize('<快乐的一天> 3412312 <222')).toEqual('<快乐的一天> 3412312 <222');
        done();
      });

      it('should sanitize backup object.', function (done) {
        request(app)
          .post('/body')
          .send({
            data: {
              data: '<!BACKUP V2.0.0>\n[0,"zNKYwnJSLskANbQTNwbXnCbDwz4rwoyWzF9f",0,0,"ArcBlock Staging","https://www.staging.arcblock.io/.well-known/service/blocklet/logo","https://www.staging.arcblock.io","/.well-known/service/websocket",1726728837055,1,0,1]\n[0,"zNKdGk4p2FQZLAGfzQGNTsufoJuiaa9KhFD5",0,0,"ArcBlock Launcher","https://launcher.arcblock.io/payment/.well-known/service/blocklet/logo?v=1.0.0","https://launcher.arcblock.io","/.well-known/service/websocket",1717725098541,1,0,1]\n[0,"zNKiVVb2cPQsszM938Jq1BcU5dTuuhyFJdE2",0,0,"Token Data","https://token-data.arcblock.io/.well-known/service/blocklet/logo","https://token-data.arcblock.io","/.well-known/service/websocket",1717725031626,1,0,1]\n[0,"zNKZNVyUAJyyv2A7V8B8BDTWGU1dJk5adhzh",0,0,"Dapp Explore","https://explore.didwallet.io/.well-known/service/blocklet/logo?version=0.1.3","https://explore.didwallet.io","/.well-known/service/websocket",1717725031492,1,0,1]',
            },
            method: 'PUT',
            url: '/app/api/space/zNKfzqbhy9xt7mq7PWFSqSLgxzPHfKQ1yyQo/app/z1iiLgvaVnFikDApL7Z4w2SmYX4gbpjX7uc/object/app-records.txt',
          })
          .expect(
            200,
            {
              body: {
                data: {
                  data: '<!BACKUP V2.0.0>\n[0,"zNKYwnJSLskANbQTNwbXnCbDwz4rwoyWzF9f",0,0,"ArcBlock Staging","https://www.staging.arcblock.io/.well-known/service/blocklet/logo","https://www.staging.arcblock.io","/.well-known/service/websocket",1726728837055,1,0,1]\n[0,"zNKdGk4p2FQZLAGfzQGNTsufoJuiaa9KhFD5",0,0,"ArcBlock Launcher","https://launcher.arcblock.io/payment/.well-known/service/blocklet/logo?v=1.0.0","https://launcher.arcblock.io","/.well-known/service/websocket",1717725098541,1,0,1]\n[0,"zNKiVVb2cPQsszM938Jq1BcU5dTuuhyFJdE2",0,0,"Token Data","https://token-data.arcblock.io/.well-known/service/blocklet/logo","https://token-data.arcblock.io","/.well-known/service/websocket",1717725031626,1,0,1]\n[0,"zNKZNVyUAJyyv2A7V8B8BDTWGU1dJk5adhzh",0,0,"Dapp Explore","https://explore.didwallet.io/.well-known/service/blocklet/logo?version=0.1.3","https://explore.didwallet.io","/.well-known/service/websocket",1717725031492,1,0,1]',
                },
                method: 'PUT',
                url: '/app/api/space/zNKfzqbhy9xt7mq7PWFSqSLgxzPHfKQ1yyQo/app/z1iiLgvaVnFikDApL7Z4w2SmYX4gbpjX7uc/object/app-records.txt',
              },
            },
            done
          );
      });

      it('should sanitize allowedKeys.', function (done) {
        expect(
          sanitize({
            allowedKeys: '<script> alert("XSS")</script>',
            aaa: '<script> alert("XSS")</script>',
          })
        ).toEqual({
          allowedKeys: '<script> alert("XSS")</script>',
          aaa: '',
        });
        done();
      });

      it('should sanitize text body.', function (done) {
        request(app)
          .post('/body')
          .send({
            chunchun:
              '<!-- something --> <<<<<<< 123& <Box>312</Box> `abc`  ../../abg.png <script>alert("XSS")</script><div onclick="alert(123)">312</div><input value="321"/> <svg viewBox="0 0 209.621 248.055"> </svg><a href="https://32.com">2312</a>',
            title: '<test> title',
            title2: '<2312312312312&&',
            happy: '快乐的一天  <gagagagagaga',
            happy2: '快乐的一天 <日记> ',
          })
          .expect(
            200,
            {
              body: {
                chunchun:
                  ' <<<<<<< 123& <Box>312</Box> `abc`  ../../abg.png <div>312</div>  <a href="https://32.com">2312</a>',
                title: '<test> title',
                title2: '<2312312312312&&',
                happy: '快乐的一天  <gagagagagaga',
                happy2: '快乐的一天 <日记> ',
              },
            },
            done
          );
      });

      it('should sanitize "x-" header.', function (done) {
        request(app)
          .post('/headers')
          .set({
            x: '.../abc.png',
            'x-abc': '.../abc.png',
            'x-uploader-xxx': JSON.stringify({
              name: '<object>99999-xxx</object>',
              url: '.../abc.png',
            }),
            'x-error': '<script>alert("XSS")</script>',
          })
          .expect(200)
          .expect(function (res) {
            expect(res.body.headers).toEqual(
              expect.objectContaining({
                x: '.../abc.png',
                'x-abc': '.../abc.png',
                'x-uploader-xxx': JSON.stringify({
                  name: '99999-xxx',
                  url: '.../abc.png',
                }),
                'x-error': '',
              })
            );
          })
          .end(done);
      });
    });

    describe('Sanitize simple object', function () {
      it('should sanitize clean body.', function (done) {
        request(app)
          .post('/body')
          .send({
            y: 4,
            z: false,
            w: 'bla bla',
            a: '<p>Test</p>',
          })
          .expect(
            200,
            {
              body: {
                y: 4,
                z: false,
                w: 'bla bla',
                a: '<p>Test</p>',
              },
            },
            done
          );
      });

      it('should sanitize clean headers.', function (done) {
        request(app)
          .post('/headers')
          .set({
            y: '4',
            z: 'false',
            w: 'bla bla',
            a: '<p>Test</p>',
          })
          .expect(200)
          .expect(function (res) {
            expect(res.body.headers).toEqual(
              expect.objectContaining({
                y: '4',
                z: 'false',
                w: 'bla bla',
                a: '<p>Test</p>',
              })
            );
          })
          .end(done);
      });

      it('should sanitize clean query.', function (done) {
        request(app)
          .get('/query?y=4&z=false&w=bla bla&a=<p>Test</p>')
          .expect(
            200,
            {
              query: {
                y: '4',
                z: 'false',
                w: 'bla bla',
                a: '<p>Test</p>',
              },
            },
            done
          );
      });

      it('should sanitize dirty body.', function (done) {
        request(app)
          .post('/body')
          .send({
            a: '<script>Test</script>',
            b: '<p onclick="return;">Test</p>',
            c: '',
          })
          .expect(
            200,
            {
              body: {
                a: '',
                b: '<p>Test</p>',
                c: '',
              },
            },
            done
          );
      });

      it('should sanitize dirty query.', function (done) {
        request(app)
          .get('/query?a=<script>Test</script>&b=<p onclick="return;">Test</p>&c=')
          .expect(
            200,
            {
              query: {
                a: '',
                b: '<p>Test</p>',
                c: '',
              },
            },
            done
          );
      });

      it('should sanitize dirty headers.', function (done) {
        request(app)
          .post('/headers')
          .set({
            a: '<script>Test</script>',
            b: '<p onclick="return;">Test</p>',
            c: '',
          })
          .expect(200)
          .expect(function (res) {
            expect(res.body.headers).toEqual(
              expect.objectContaining({
                a: '',
                b: '<p>Test</p>',
                c: '',
              })
            );
          })
          .end(done);
      });
    });

    describe('Sanitize complex object', function () {
      it('should sanitize clean body.', function (done) {
        request(app)
          .post('/body')
          .send({
            y: 4,
            z: false,
            w: 'bla bla',
            a: '<p>Test</p>',
            arr: [
              '<h1>H1 Test</h1>',
              'bla bla',
              {
                i: ['<h3>H3 Test</h3>', 'bla bla', false, 5],
                j: '<a href="/">Link</a>',
              },
            ],
            obj: {
              e: 'Test1',
              r: {
                a: '<h6>H6 Test</h6>',
              },
            },
          })
          .expect(
            200,
            {
              body: {
                y: 4,
                z: false,
                w: 'bla bla',
                a: '<p>Test</p>',
                arr: [
                  '<h1>H1 Test</h1>',
                  'bla bla',
                  {
                    i: ['<h3>H3 Test</h3>', 'bla bla', false, 5],
                    j: '<a href="/">Link</a>',
                  },
                ],
                obj: {
                  e: 'Test1',
                  r: {
                    a: '<h6>H6 Test</h6>',
                  },
                },
              },
            },
            done
          );
      });

      it('should sanitize dirty body.', function (done) {
        request(app)
          .post('/body')
          .send({
            a: '<script>Test</script>',
            b: '<p onclick="return;">Test</p>',
            c: '',
            arr: [
              "<h1 onclick='return false;'>H1 Test</h1>",
              'bla bla',
              {
                i: ["<h3 onclick='function x(e) {console.log(e); return;}'>H3 Test</h3>", 'bla bla', false, 5],
                j: '<a href="/" onclick="return 0;">Link</a>',
              },
            ],
            obj: {
              e: '<script>while (true){alert("Test To OO")}</script>',
              r: {
                a: '<h6>H6 Test</h6>',
              },
            },
          })
          .expect(
            200,
            {
              body: {
                a: '',
                b: '<p>Test</p>',
                c: '',
                arr: [
                  '<h1>H1 Test</h1>',
                  'bla bla',
                  {
                    i: ['<h3>H3 Test</h3>', 'bla bla', false, 5],
                    j: '<a href="/">Link</a>',
                  },
                ],
                obj: {
                  e: '',
                  r: {
                    a: '<h6>H6 Test</h6>',
                  },
                },
              },
            },
            done
          );
      });
    });
  });

  describe('Sanitize with custom options as middleware before all routes', function () {
    const app = express();
    const options = {
      allowedKeys: ['c'],
    };
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(xss(options));

    app.post('/body', function (req, res) {
      res.status(200).json({
        body: req.body,
      });
    });

    app.post('/headers', function (req, res) {
      res.status(200).json({
        headers: req.headers,
      });
    });

    app.get('/query', function (req, res) {
      res.status(200).json({
        query: req.query,
      });
    });
    describe('Sanitize simple object', function () {
      it('should sanitize clean body.', function (done) {
        request(app)
          .post('/body')
          .send({
            y: 4,
            z: false,
            w: 'bla bla',
            a: '<p>Test</p>',
          })
          .expect(
            200,
            {
              body: {
                y: 4,
                z: false,
                w: 'bla bla',
                a: '<p>Test</p>',
              },
            },
            done
          );
      });

      it('should sanitize clean headers.', function (done) {
        request(app)
          .post('/headers')
          .set({
            y: '4',
            z: 'false',
            w: 'bla bla',
            a: '<p>Test</p>',
          })
          .expect(200)
          .expect(function (res) {
            expect(res.body.headers).toEqual(
              expect.objectContaining({
                y: '4',
                z: 'false',
                w: 'bla bla',
                a: '<p>Test</p>',
              })
            );
          })
          .end(done);
      });

      it('should sanitize clean query.', function (done) {
        request(app)
          .get('/query?y=4&z=false&w=bla bla&a=<p>Test</p>')
          .expect(
            200,
            {
              query: {
                y: '4',
                z: 'false',
                w: 'bla bla',
                a: '<p>Test</p>',
              },
            },
            done
          );
      });

      it('should sanitize dirty body.', function (done) {
        request(app)
          .post('/body')
          .send({
            a: '<script>Test</script>',
            b: '<p onclick="return;">Test</p>',
            c: '',
          })
          .expect(
            200,
            {
              body: {
                a: '',
                b: '<p>Test</p>',
                c: '',
              },
            },
            done
          );
      });

      it('should sanitize dirty query.', function (done) {
        request(app)
          .get('/query?a=<script>Test</script>&b=<p onclick="return;">Test</p>&c=')
          .expect(
            200,
            {
              query: {
                a: '',
                b: '<p>Test</p>',
                c: '',
              },
            },
            done
          );
      });

      it('should sanitize dirty headers.', function (done) {
        request(app)
          .post('/headers')
          .set({
            a: '<script>Test</script>',
            b: '<p onclick="return;">Test</p>',
            c: '',
          })
          .expect(200)
          .expect(function (res) {
            expect(res.body.headers).toEqual(
              expect.objectContaining({
                a: '',
                b: '<p>Test</p>',
                c: '',
              })
            );
          })
          .end(done);
      });
    });

    describe('Sanitize complex object', function () {
      it('should sanitize clean body.', function (done) {
        request(app)
          .post('/body')
          .send({
            y: 4,
            z: false,
            w: 'bla bla',
            a: '<p>Test</p>',
            arr: [
              '<h1>H1 Test</h1>',
              'bla bla',
              {
                i: ['<h3>H3 Test</h3>', 'bla bla', false, 5],
                j: '<a href="/">Link</a>',
              },
            ],
            obj: {
              e: 'Test1',
              r: {
                a: '<h6>H6 Test</h6>',
              },
            },
          })
          .expect(
            200,
            {
              body: {
                y: 4,
                z: false,
                w: 'bla bla',
                a: '<p>Test</p>',
                arr: [
                  '<h1>H1 Test</h1>',
                  'bla bla',
                  {
                    i: ['<h3>H3 Test</h3>', 'bla bla', false, 5],
                    j: '<a href="/">Link</a>',
                  },
                ],
                obj: {
                  e: 'Test1',
                  r: {
                    a: '<h6>H6 Test</h6>',
                  },
                },
              },
            },
            done
          );
      });

      it('should sanitize dirty body.', function (done) {
        request(app)
          .post('/body')
          .send({
            a: '<script>Test</script>',
            b: '<p onclick="return;">Test</p>',
            c: '',
            arr: [
              "<h1 onclick='return false;'>H1 Test</h1>",
              'bla bla',
              {
                i: ["<h3 onclick='function x(e) {console.log(e); return;}'>H3 Test</h3>", 'bla bla', false, 5],
                j: '<a href="/" onclick="return 0;">Link</a>',
              },
            ],
            obj: {
              e: '<script>while (true){alert("Test To OO")}</script>',
              r: {
                a: '<h6>H6 Test</h6>',
              },
            },
          })
          .expect(
            200,
            {
              body: {
                a: '',
                b: '<p>Test</p>',
                c: '',
                arr: [
                  '<h1>H1 Test</h1>',
                  'bla bla',
                  {
                    i: ['<h3>H3 Test</h3>', 'bla bla', false, 5],
                    j: '<a href="/">Link</a>',
                  },
                ],
                obj: {
                  e: '',
                  r: {
                    a: '<h6>H6 Test</h6>',
                  },
                },
              },
            },
            done
          );
      });
    });
  });

  describe('Sanitize with default settings as middleware before each route', function () {
    const app = express();
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    app.post('/body', xss(), function (req, res) {
      res.status(200).json({
        body: req.body,
      });
    });

    app.post('/headers', xss(), function (req, res) {
      res.status(200).json({
        headers: req.headers,
      });
    });

    app.get('/query', function (req, res) {
      res.status(200).json({
        query: req.query,
      });
    });
    describe('Sanitize simple object', function () {
      it('should sanitize clean body.', function (done) {
        request(app)
          .post('/body')
          .send({
            y: 4,
            z: false,
            w: 'bla bla',
            a: '<p>Test</p>',
          })
          .expect(
            200,
            {
              body: {
                y: 4,
                z: false,
                w: 'bla bla',
                a: '<p>Test</p>',
              },
            },
            done
          );
      });

      it('should sanitize clean headers.', function (done) {
        request(app)
          .post('/headers')
          .set({
            y: '4',
            z: 'false',
            w: 'bla bla',
            a: '<p>Test</p>',
          })
          .expect(200)
          .expect(function (res) {
            expect(res.body.headers).toEqual(
              expect.objectContaining({
                y: '4',
                z: 'false',
                w: 'bla bla',
                a: '<p>Test</p>',
              })
            );
          })
          .end(done);
      });

      it('should sanitize clean query.', function (done) {
        request(app)
          .get('/query?y=4&z=false&w=bla bla&a=<p>Test</p>')
          .expect(
            200,
            {
              query: {
                y: '4',
                z: 'false',
                w: 'bla bla',
                a: '<p>Test</p>',
              },
            },
            done
          );
      });

      it('should sanitize dirty body.', function (done) {
        request(app)
          .post('/body')
          .send({
            a: '<script>Test</script>',
            b: '<p onclick="return;">Test</p>',
            c: '',
          })
          .expect(
            200,
            {
              body: {
                a: '',
                b: '<p>Test</p>',
                c: '',
              },
            },
            done
          );
      });

      it('should not sanitize dirty query.', function (done) {
        request(app)
          .get('/query?a=<script>Test</script>&b=<p onclick="return;">Test</p>&c=')
          .expect(
            200,
            {
              query: {
                a: '<script>Test</script>',
                b: '<p onclick="return;">Test</p>',
                c: '',
              },
            },
            done
          );
      });

      it('should sanitize dirty headers.', function (done) {
        request(app)
          .post('/headers')
          .set({
            a: '<script>Test</script>',
            b: '<p onclick="return;">Test</p>',
            c: '',
          })
          .expect(200)
          .expect(function (res) {
            expect(res.body.headers).toEqual(
              expect.objectContaining({
                a: '',
                b: '<p>Test</p>',
                c: '',
              })
            );
          })
          .end(done);
      });
    });

    describe('Sanitize complex object', function () {
      it('should sanitize clean body.', function (done) {
        request(app)
          .post('/body')
          .send({
            y: 4,
            z: false,
            w: 'bla bla',
            a: '<p>Test</p>',
            arr: [
              '<h1>H1 Test</h1>',
              'bla bla',
              {
                i: ['<h3>H3 Test</h3>', 'bla bla', false, 5],
                j: '<a href="/">Link</a>',
              },
            ],
            obj: {
              e: 'Test1',
              r: {
                a: '<h6>H6 Test</h6>',
              },
            },
          })
          .expect(
            200,
            {
              body: {
                y: 4,
                z: false,
                w: 'bla bla',
                a: '<p>Test</p>',
                arr: [
                  '<h1>H1 Test</h1>',
                  'bla bla',
                  {
                    i: ['<h3>H3 Test</h3>', 'bla bla', false, 5],
                    j: '<a href="/">Link</a>',
                  },
                ],
                obj: {
                  e: 'Test1',
                  r: {
                    a: '<h6>H6 Test</h6>',
                  },
                },
              },
            },
            done
          );
      });

      it('should sanitize dirty body.', function (done) {
        request(app)
          .post('/body')
          .send({
            a: '<script>Test</script>',
            b: '<p onclick="return;">Test</p>',
            c: '',
            arr: [
              "<h1 onclick='return false;'>H1 Test</h1>",
              'bla bla',
              {
                i: ["<h3 onclick='function x(e) {console.log(e); return;}'>H3 Test</h3>", 'bla bla', false, 5],
                j: '<a href="/" onclick="return 0;">Link</a>',
              },
            ],
            obj: {
              e: '<script>while (true){alert("Test To OO")}</script>',
              r: {
                a: '<h6>H6 Test</h6>',
              },
            },
          })
          .expect(
            200,
            {
              body: {
                a: '',
                b: '<p>Test</p>',
                c: '',
                arr: [
                  '<h1>H1 Test</h1>',
                  'bla bla',
                  {
                    i: ['<h3>H3 Test</h3>', 'bla bla', false, 5],
                    j: '<a href="/">Link</a>',
                  },
                ],
                obj: {
                  e: '',
                  r: {
                    a: '<h6>H6 Test</h6>',
                  },
                },
              },
            },
            done
          );
      });
    });
  });

  describe('Sanitize with custom options as middleware before each route', function () {
    const app = express();
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    app.post('/body', xss({ allowedKeys: ['c'] }), function (req, res) {
      res.status(200).json({
        body: req.body,
      });
    });

    app.post('/headers', xss(), function (req, res) {
      res.status(200).json({
        headers: req.headers,
      });
    });

    app.get('/query', function (req, res) {
      res.status(200).json({
        query: req.query,
      });
    });
    describe('Sanitize simple object', function () {
      it('should sanitize clean body.', function (done) {
        request(app)
          .post('/body')
          .send({
            y: 4,
            z: false,
            w: 'bla bla',
            a: '<p>Test</p>',
          })
          .expect(
            200,
            {
              body: {
                y: 4,
                z: false,
                w: 'bla bla',
                a: '<p>Test</p>',
              },
            },
            done
          );
      });

      it('should sanitize clean headers.', function (done) {
        request(app)
          .post('/headers')
          .set({
            y: '4',
            z: 'false',
            w: 'bla bla',
            a: '<p>Test</p>',
          })
          .expect(200)
          .expect(function (res) {
            expect(res.body.headers).toEqual(
              expect.objectContaining({
                y: '4',
                z: 'false',
                w: 'bla bla',
                a: '<p>Test</p>',
              })
            );
          })
          .end(done);
      });

      it('should sanitize clean query.', function (done) {
        request(app)
          .get('/query?y=4&z=false&w=bla bla&a=<p>Test</p>')
          .expect(
            200,
            {
              query: {
                y: '4',
                z: 'false',
                w: 'bla bla',
                a: '<p>Test</p>',
              },
            },
            done
          );
      });

      it('should sanitize dirty body.', function (done) {
        request(app)
          .post('/body')
          .send({
            a: '<script>Test</script>',
            b: '<p onclick="return;">Test</p>',
            c: '',
          })
          .expect(
            200,
            {
              body: {
                a: '',
                b: '<p>Test</p>',
                c: '',
              },
            },
            done
          );
      });

      it('should not sanitize dirty query.', function (done) {
        request(app)
          .get('/query?a=<script>Test</script>&b=<p onclick="return;">Test</p>&c=')
          .expect(
            200,
            {
              query: {
                a: '<script>Test</script>',
                b: '<p onclick="return;">Test</p>',
                c: '',
              },
            },
            done
          );
      });

      it('should sanitize dirty headers.', function (done) {
        request(app)
          .post('/headers')
          .set({
            a: '<script>Test</script>',
            b: '<p onclick="return;">Test</p>',
            c: '',
          })
          .expect(200)
          .expect(function (res) {
            expect(res.body.headers).toEqual(
              expect.objectContaining({
                a: '',
                b: '<p>Test</p>',
                c: '',
              })
            );
          })
          .end(done);
      });
    });

    describe('Sanitize complex object', function () {
      it('should sanitize clean body.', function (done) {
        request(app)
          .post('/body')
          .send({
            y: 4,
            z: false,
            w: 'bla bla',
            a: '<p>Test</p>',
            arr: [
              '<h1>H1 Test</h1>',
              'bla bla',
              {
                i: ['<h3>H3 Test</h3>', 'bla bla', false, 5],
                j: '<a href="/">Link</a>',
                c: '',
              },
            ],
            obj: {
              e: 'Test1',
              r: {
                a: '<h6>H6 Test</h6>',
              },
            },
          })
          .expect(
            200,
            {
              body: {
                y: 4,
                z: false,
                w: 'bla bla',
                a: '<p>Test</p>',
                arr: [
                  '<h1>H1 Test</h1>',
                  'bla bla',
                  {
                    i: ['<h3>H3 Test</h3>', 'bla bla', false, 5],
                    j: '<a href="/">Link</a>',
                    c: '',
                  },
                ],
                obj: {
                  e: 'Test1',
                  r: {
                    a: '<h6>H6 Test</h6>',
                  },
                },
              },
            },
            done
          );
      });

      it('should sanitize dirty body.', function (done) {
        request(app)
          .post('/body')
          .send({
            a: '<script>Test</script>',
            b: '<p onclick="return;">Test</p>',
            c: '',
            arr: [
              "<h1 onclick='return false;'>H1 Test</h1>",
              'bla bla',
              {
                i: ["<h3 onclick='function x(e) {console.log(e); return;}'>H3 Test</h3>", 'bla bla', false, 5],
                j: '<a href="/" onclick="return 0;">Link</a>',
              },
            ],
            obj: {
              e: '<script>while (true){alert("Test To OO")}</script>',
              r: {
                a: '<h6>H6 Test</h6>',
              },
            },
          })
          .expect(
            200,
            {
              body: {
                a: '',
                b: '<p>Test</p>',
                c: '',
                arr: [
                  '<h1>H1 Test</h1>',
                  'bla bla',
                  {
                    i: ['<h3>H3 Test</h3>', 'bla bla', false, 5],
                    j: '<a href="/">Link</a>',
                  },
                ],
                obj: {
                  e: '',
                  r: {
                    a: '<h6>H6 Test</h6>',
                  },
                },
              },
            },
            done
          );
      });
    });
  });

  describe('Sanitize data with default settings as function', function () {
    describe('Sanitize simple object', function () {
      it('should sanitize clean body.', function (done) {
        expect(
          sanitize({
            y: 4,
            z: false,
            w: 'bla bla',
            a: '<p>Test</p>',
          })
        ).toEqual({
          y: 4,
          z: false,
          w: 'bla bla',
          a: '<p>Test</p>',
        });
        done();
      });

      it('should sanitize dirty body.', function (done) {
        expect(
          sanitize({
            a: '<script>Test</script>',
            b: '<p onclick="return;">Test</p>',
            c: '',
          })
        ).toEqual({
          a: '',
          b: '<p>Test</p>',
          c: '',
        });
        done();
      });
    });

    describe('Sanitize complex object', function () {
      it('should sanitize clean body.', function (done) {
        expect(
          sanitize({
            y: 4,
            z: false,
            w: 'bla bla',
            a: '<p>Test</p>',
            arr: [
              '<h1>H1 Test</h1>',
              'bla bla',
              {
                i: ['<h3>H3 Test</h3>', 'bla bla', false, 5],
                j: '<a href="/">Link</a>',
              },
            ],
            obj: {
              e: 'Test1',
              r: {
                a: '<h6>H6 Test</h6>',
              },
            },
          })
        ).toEqual({
          y: 4,
          z: false,
          w: 'bla bla',
          a: '<p>Test</p>',
          arr: [
            '<h1>H1 Test</h1>',
            'bla bla',
            {
              i: ['<h3>H3 Test</h3>', 'bla bla', false, 5],
              j: '<a href="/">Link</a>',
            },
          ],
          obj: {
            e: 'Test1',
            r: {
              a: '<h6>H6 Test</h6>',
            },
          },
        });
        done();
      });

      it('should sanitize dirty body.', function (done) {
        expect(
          sanitize({
            a: '<script>Test</script>',
            b: '<p onclick="return;">Test</p>',
            c: '',
            arr: [
              "<h1 onclick='return false;'>H1 Test</h1>",
              'bla bla',
              {
                i: ["<h3 onclick='function x(e) {console.log(e); return;}'>H3 Test</h3>", 'bla bla', false, 5],
                j: '<a href="/" onclick="return 0;">Link</a>',
              },
            ],
            obj: {
              e: '<script>while (true){alert("Test To OO")}</script>',
              r: {
                a: '<h6>H6 Test</h6>',
              },
            },
          })
        ).toEqual({
          a: '',
          b: '<p>Test</p>',
          c: '',
          arr: [
            '<h1>H1 Test</h1>',
            'bla bla',
            {
              i: ['<h3>H3 Test</h3>', 'bla bla', false, 5],
              j: '<a href="/">Link</a>',
            },
          ],
          obj: {
            e: '',
            r: {
              a: '<h6>H6 Test</h6>',
            },
          },
        });
        done();
      });
    });

    describe('Sanitize null value', function () {
      it('should return null.', function (done) {
        expect(sanitize(null)).toEqual(null);
        done();
      });
    });
  });

  describe('Sanitize data with custom options as function', function () {
    describe('Sanitize simple object', function () {
      it('should sanitize dirty body.', function (done) {
        expect(
          sanitize(
            {
              a: '<script>Test</script>',
              b: '<p onclick="return;">Test</p>',
              c: '',
            },
            { allowedKeys: ['c'] }
          )
        ).toEqual({
          a: '',
          b: '<p>Test</p>',
          c: '',
        });
        done();
      });
    });

    describe('Sanitize complex object with attributes', function () {
      it('should sanitize but keep asked attributes.', function (done) {
        expect(
          sanitize(
            {
              d: '<input value="some value" class="test-class" />',
            },
            {
              allowedTags: ['input'],
              allowedAttributes: {
                input: ['value'],
              },
            }
          )
        ).toEqual({
          d: '',
        });
        done();
      });
    });

    describe('Sanitize complex object', function () {
      it('should sanitize dirty body.', function (done) {
        expect(
          sanitize(
            {
              a: '<script>Test</script>',
              b: '<p onclick="return;">Test</p>',
              c: '',
              arr: [
                "<h1 onclick='return false;'>H1 Test</h1>",
                'bla bla',
                {
                  i: ["<h3 onclick='function x(e) {console.log(e); return;}'>H3 Test</h3>", 'bla bla', false, 5],
                  j: '<a href="/" onclick="return 0;">Link</a>',
                },
              ],
              obj: {
                e: '<script>while (true){alert("Test To OO")}</script>',
                r: {
                  a: '<h6>H6 Test</h6>',
                },
              },
            },
            { allowedKeys: ['e'] }
          )
        ).toEqual({
          a: '',
          b: '<p>Test</p>',
          c: '',
          arr: [
            '<h1>H1 Test</h1>',
            'bla bla',
            {
              i: ['<h3>H3 Test</h3>', 'bla bla', false, 5],
              j: '<a href="/">Link</a>',
            },
          ],
          obj: {
            e: '',
            r: {
              a: '<h6>H6 Test</h6>',
            },
          },
        });
        done();
      });
    });
  });

  describe('Sanitize data with custom options as function', function () {
    describe('Sanitize simple object', function () {
      it('should sanitize dirty body.', function (done) {
        expect(
          sanitize(
            {
              a: '<script>Test</script>',
              b: '<p onclick="return;">Test</p>',
              c: '',
            },
            { allowedKeys: ['c'] }
          )
        ).toEqual({
          a: '',
          b: '<p>Test</p>',
          c: '',
        });
        done();
      });
    });

    describe('XSS bypass by using prototype pollution issue', function () {
      it('should sanitize dirty data after prototype pollution.', function (done) {
        // @ts-ignore
        Object.prototype.allowedTags = ['script'];
        expect(
          sanitize(
            {
              a: '<script>Test</script>',
            },
            {}
          )
        ).toEqual({
          a: '',
        });
        done();
      });
    });
  });

  describe('SVG attribute case preservation', function () {
    it('should preserve tag name case in SVG tags.', function (done) {
      const svgInput = [
        '<svg viewBox="0 0 10 10">',
        '<linearGradient id="lg1" gradientUnits="objectBoundingBox"><stop stop-color="#000"/></linearGradient>',
        '<linearGradient id="lg2"/>', // no whitespace before closing slash
        '<clipPath id="clip"><rect width="10" height="10"/></clipPath>',
        '<radialGradient id="rg1" />',
        '<mask id="mask1"><rect width="10" height="10"/></mask>',
        '</svg>',
      ].join('');
      const result = sanitizeSvg(svgInput, { preserveCase: true });

      // Test that tag names preserve their original case
      expect(result).toContain('<linearGradient');
      expect(result).toContain('clipPath');
      expect(result).toContain('</clipPath>');
      expect(result).toContain('<radialGradient'); // not radialgradient
      expect(result).toContain('gradientUnits'); // attribute case should also be preserved
      expect(result).toContain('mask'); // no change
      expect(result).toContain('stop-color'); // no change

      expect(result).not.toContain('lineargradient');
      expect(result).not.toContain('clippath');
      expect(result).not.toContain('</clippath>');
      expect(result).not.toContain('<radialgradient');
      expect(result).not.toContain('gradientunits');

      done();
    });
  });
});
