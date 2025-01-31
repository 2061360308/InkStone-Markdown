import { defineStore } from "pinia";
import { Ref, ref, watch } from "vue";
import { useRouter } from "vue-router";

export const useGlobalStore = defineStore("global", () => {
  const router = useRouter();

  // const repoName: Ref<string> = ref(localStorage.getItem("repoName")||"");  // 仓库名称

  // watch(repoName, (newVal) => {
  //   localStorage.setItem("repoName", newVal);  // 保存仓库名称
  // });
  
  const goLogin = () => {
    localStorage.removeItem("jumpLogin");  // 清除跳过登录标记
    router.replace({ name: "login" });
  };

  return {
    goLogin,
  };
});
