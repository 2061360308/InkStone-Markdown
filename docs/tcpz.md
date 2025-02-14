## 注册腾讯云账号

#### 点击[腾讯云官网](https://cloud.tencent.com/) 注册账号，这里不做演示。 


## 对象存储cos

#### 1.点击[cos](https://console.cloud.tencent.com/cos)进入对象存储cos网页。

#### 2.进入后，创建存储桶

<img src="/images/cht.png" alt="创建存储桶" width="400" height="300">

#### 3.存储桶名称取按照人家要求取，选择公有读私有写选项，取下AZ特性，同意，然后下一步，一直到创建，不需要任何其他操作。
<img src="/images/az.png" alt="创建存储桶1" width="600" height="600">

#### 4.然后设置 跨域访问CORS设置,添加规则。
<img src="/images/corssz.png" alt="创建存储桶1" width="900" height="300">

#### 5.设置跨域请求，按照下图设置，
<img src="/images/cors2.png" alt="CORS设置" width="500" height="500">


## InkStone图床配置

#### 1.点击软件下面的设置，然后右侧找到图床设置。没配置前图床设置是红色的，显示图床不可用，配置好后就和我下面的图一样变为绿色。

<img src="/images/tcsz.png" alt="CORS设置" width="300" height="500">

#### 2.查看主账号密钥，密钥只能看一次，建议截屏保存或者下载专门的csv文件。点击[密钥](https://console.cloud.tencent.com/cam/capi) 查看密钥和id，进去后点击最左边最下面的API密钥管理

<img src="/images/miy.png" alt="api密钥" width="800" height="500">


### 3.复制粘贴刚才的一个id一个密钥，然后填到图床设置的accessKeyid和SecretAccessKeyid中。

第一个buket 就是你刚才创建桶的名称，你可以再存储桶列表那里查看你刚才创建桶的名字。

<img src="/images/tupz1.png" alt="图床配置" width="800" height="500">

然后第二个endpoint 就是还是再创建桶列表哪里查看，你的所属地域,然后再按照这个格式https://cos.ap-xxxxxxxx.myqcloud.com 填写。

<img src="/images/scdy.png" alt="图床配置" width="1000" height="200">

然后第三个 图床根的url就按照这个模板填写 
https://你的存储桶名称.cos.ap-xxxxxx.myqcloud.com

操作完这些后，如果发现图床按钮红色变为绿色可用，则配置成功，如果没变化，检查密钥和id是否填反了，或者格式是不是有问题，或者重新打开设置。 设置完后，就可以随便的添加本地照片上传到GitHub。