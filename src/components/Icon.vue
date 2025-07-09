<script lang="ts" setup>
import { Icon, type IconProps } from "@iconify/vue";

withDefaults(defineProps<Partial<IconProps>>(), { icon: "" });
</script>

<template>
  <Icon v-bind="$attrs" :icon="icon"></Icon>
</template>
