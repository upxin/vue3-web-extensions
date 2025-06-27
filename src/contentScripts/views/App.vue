<script setup lang="ts">
import { useToggle } from "@vueuse/core";
import DataSimulation from "./DataSimulation.vue";
import Drag from "./Drag.vue";
import logo from "~/assets/logo.svg";
import "uno.css";

const [show, toggle] = useToggle(false);
</script>

<template>
  <img
    :src="logo"
    class="fixed bottom-20px left-20px z-9999 cursor-pointer"
    alt="extension icon"
    @click="
      () => {
        toggle();
      }
    "
  />
  <Drag v-model:visible="show">
    <DataSimulation></DataSimulation>
  </Drag>
</template>
