<script setup lang="ts">
import api from "@/utils/api";
import { Ref, defineProps, defineEmits, ref, watch } from "vue";

const props = defineProps({
    path: {
        type: String,
        required: true,
    }
});

const emit = defineEmits(["change-sha"]);

const changeSha = (sha: string) => {
    emit("change-sha", sha);
};

const histories: Ref<any[]> = ref([]);

watch(
    () => props.path,
    async (newPath) => {
        histories.value = await api.getFileCommitHistory(newPath);
    },
    { immediate: true }
);
</script>

<template>
  <el-timeline>
    <el-timeline-item
      :timestamp="data.commit.author.date"
      placement="top"
      v-for="data in histories"
      :key="data.sha"
    >
      <el-card>
        <div class="commit">
          <div class="info">
            <p>{{ data.commit.message }}</p>
            <div class="commiter">
              <el-image
                class="avatar"
                v-if="data.author"
                :src="data.author.avatar_url + '&size=32'"
              ></el-image>
              <span>{{ data.commit.author.name }}</span>
              <span> committed on </span>
              <span>{{ data.commit.author.date }}</span>
            </div>
          </div>
          <div class="operation">
            <el-button link size="small" @click="changeSha(data.sha)">查看</el-button>
          </div>
        </div>
      </el-card>
    </el-timeline-item>
  </el-timeline>
</template>

<style scoped>
.commit {
  display: flex;
  justify-content: space-between;
}

.commit .info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.commit .info .commiter {
  display: flex;
  align-items: center;
  font-size: 10px;
  color: #666;
  white-space: nowrap;
  gap: 2px;
}

.commit .info .commiter .avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.commit .operation {
  display: flex;
  align-items: center;
}

.commit .operation el-button {
  margin-left: 10px;
}
</style>
