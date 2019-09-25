import Vue from 'vue'
import FrameOptions from './FrameOptions.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(FrameOptions),
}).$mount('#app')
