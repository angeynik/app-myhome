<!-- components/MenuDropdown.vue -->
<template>
  <Teleport to="body">
    <div v-if="visible" class="menu-dropdown-overlay" @click.self="close">
        <!-- <div class="menu-dropdown-overlay" @click.self="close"> -->
      <div class="menu-dropdown" :style="positionStyle">
<div
  v-for="(item, idx) in items"
  :key="idx"
>
  <hr v-if="item.divider" class="menu-dropdown-divider" />
  <div
    v-else
    class="menu-dropdown-item"
    @click="selectItem(item)"
  >
    {{ item.label }}
  </div>
</div>
      </div>
    </div>
  </Teleport>
</template>

<script>
export default {
  name: 'MenuDropdown',
  props: {
    visible: Boolean,
    items: {
      type: Array,
      default: () => []
    },
    anchorElement: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'select'],
  computed: {
    positionStyle() {
      if (!this.anchorElement) return { top: '50px', right: '20px' };
      const rect = this.anchorElement.getBoundingClientRect();
      return {
        top: `${rect.bottom + window.scrollY + 5}px`,
        right: `${window.innerWidth - rect.right + window.scrollX}px`
      };
    }
  },
  mounted() {
    document.addEventListener('click', this.handleOutsideClick);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleOutsideClick);
  },
  methods: {
    handleOutsideClick(event) {
      if (!this.visible) return;
      // Не закрывать, если клик был по кнопке, вызвавшей меню
      if (this.anchorElement && this.anchorElement.contains(event.target)) {
        return;
      }
      // Если меню смонтировано, и клик не внутри него
      if (this.$el && !this.$el.contains(event.target)) {
        this.close();
      }
    },
    close() {
      this.$emit('close');
    },
    selectItem(item) {
      this.$emit('select', item);
      this.close();
    }
  }
};
</script>

<style lang="css" src="@/assets/mainStyle.css"></style>