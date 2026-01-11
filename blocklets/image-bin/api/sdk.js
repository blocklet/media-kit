const Auth = require('@blocklet/sdk/service/auth');

const auth = new Auth();

(async () => {
  let result = await auth.createAccessKey({
    remark: 'from-cli',
  });
  console.log(result.data);

  result = await auth.verifyAccessKey({
    accessKeyId: result.data.accessKeySecret,
  });

  console.log(result.data);
})();
