<script setup lang="ts">
import { ref, onMounted, defineProps, defineEmits, watch } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const props = defineProps({
  show: Boolean,
});

const dialogShow = ref(props.show);

watch(
  () => props.show,
  (value) => {
    dialogShow.value = value;
  }
);

watch(
  () => dialogShow.value,
  (value) => {
    emits("update:show", value);
  }
);

const emits = defineEmits(["update:show"]);

const updateShowValue = (value: boolean) => {
  emits("update:show", value);
};

const appVersion = __APP_VERSION__;
</script>

<template>
  <el-dialog
    v-model="dialogShow"
    title="关于 | About"
    width="750"
    align-center
    destroy-on-close
  >
    <div class="content">
      <div class="info">
        <el-image class="logo" src="/cover.png" fit="cover" />
        <div class="desc">
          <span class="version">版本信息：v{{ appVersion }}</span>
          <span class="author">作者：盧瞳</span>
          <span class="email"
            ><el-button
              link
              tag="a"
              target="_blank"
              href="mailto:2061360308@qq.com"
              style="color: rgb(140, 195, 249); font-size: 13px"
              >邮箱：2061360308@qq.com</el-button
            ></span
          >
          <span class="homepage"
            ><el-button
              link
              tag="a"
              target="_blank"
              href="https://inkstone.work"
              style="color: rgb(140, 195, 249); font-size: 13px"
              >官网：https://inkstone.work</el-button
            ></span
          >
          <el-button
            plain
            tag="a"
            target="_blank"
            href="https://github.com/2061360308/InkStone/discussions"
            style="color: rgb(50, 145, 240)"
            >参与讨论</el-button
          >
        </div>
      </div>

      <div class="support">
        <div class="title">支持我们</div>
        <el-tabs tab-position="bottom" type="card">
          <el-tab-pane label="STAR" class="panel">
            <p>
              我们的项目发布在Github上，在这里Star代表您对本项目的认可。
              这也是其他用户对我们第一影响的重要来源，更多的Star意味着项目得到更多的推广，从而让我们获得更多的用户以及愿意参与贡献的开发者。
              大量用户使用能够帮助我们发现更多潜在的问题，同时更多的开发者参与则能够提升开发和维护的效率，<strong>您最终将从此收益</strong>。
            </p>
            <!--  -->
            <div class="operation">
              <el-button
                color="#997f2b"
                plain
                tag="a"
                href="https://github.com/2061360308/InkStone"
                target="_blank"
                rel="noopener noreferrer"
              >
                <font-awesome-icon
                  style="color: #e3b341; margin-right: 5px"
                  :icon="['fas', 'star']"
                  size="lg"
                />去点赞 Star
              </el-button>
            </div>
          </el-tab-pane>
          <el-tab-pane label="DONATION" class="panel">
            <p>
              作为一个开源项目，我们的开发者和维护者是完全自愿的，他们在业余时间为此项目付出了大量的心血。
              如果您觉得这个项目对您有所帮助，您可以考虑通过捐赠来支持我们，这将是对我们最大的鼓励。
              您的捐赠将用于支付项目的服务器费用、域名费用、开发者的奖励等。
            </p>
            <div class="operation">
              <el-button
                color="#995a65"
                plain
                tag="a"
                href="https://github.com/2061360308/InkStone"
                target="_blank"
                rel="noopener noreferrer"
              >
                <font-awesome-icon
                  style="color: #cc7888; margin-right: 5px"
                  :icon="['fas', 'comment-dollar']"
                  size="lg"
                />去捐款 Donation
              </el-button>
            </div>
          </el-tab-pane>
          <el-tab-pane label="ISSUES" class="panel">
            <p>
              开源项目的发展离不开用户的反馈，如果您在使用过程中遇到了问题，或者有任何建议，您可以通过Github的Issues功能来告诉我们。
              感谢您帮助我们变得更好！
            </p>
            <div class="operation">
              <el-button
                color="#317dcb"
                plain
                tag="a"
                href="https://github.com/2061360308/InkStone/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                <font-awesome-icon
                  style="color: #3e9dfe; margin-right: 5px"
                  :icon="['fas', 'square-xmark']"
                  size="lg"
                />去反馈 Issue
              </el-button>
            </div>
          </el-tab-pane>
          <el-tab-pane label="CONTRIBUTION" class="panel">
            <p>
              作为一个开源项目，我们非常欢迎任何人为我们的项目贡献代码，无论是修复Bug，增加新功能，还是改进文档，都是对我们的巨大帮助。
              <br />您可以通过Fork我们的项目，然后提交Pull Request来贡献代码。
              <br />感谢您的贡献！
            </p>
            <div class="operation">
              <el-button
                color="#21aa56"
                plain
                tag="a"
                href="https://github.com/2061360308/InkStone"
                target="_blank"
                rel="noopener noreferrer"
              >
                <font-awesome-icon
                  style="color: #2cdd71; margin-right: 5px"
                  :icon="['fas', 'handshake-angle']"
                  size="lg"
                />去贡献 Contribution
              </el-button>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.info {
  display: flex;
  justify-items: space-between;
}
.info .logo {
  height: 150px;
}

.info .desc {
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-items: flex-end;
  gap: 5px;
}

.info .desc .version {
  font-size: 15px;
  font-weight: bold;
}

.support {
  border: var(--el-border-color) solid 2px;
  border-radius: 5px;
}

.support .title {
  font-size: 17px;
  font-weight: bold;
  padding: 10px;
}

.support .panel {
  padding: 10px;
  height: 120px;
}

.support .operation {
  width: 100%;
  display: flex;
  justify-content: end;
  padding: 10px;
}
</style>
