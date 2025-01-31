import "./assets/main.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import fontAwesomeLibrary from "./utils/fontAwesomeLibrary";
fontAwesomeLibrary();

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.component("FontAwesomeIcon", FontAwesomeIcon);

if ("windowControlsOverlay" in navigator) {
  navigator.windowControlsOverlay.addEventListener(
    "geometrychange",
    (event) => {
      const { titlebarAreaRect } = event;
      // 根据 titlebarAreaRect 调整布局
      console.log("Titlebar area:", titlebarAreaRect);
    }
  );
}

app.mount("#app");
