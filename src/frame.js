import Vue from 'vue'
import Frame from './Frame.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(Frame),
}).$mount('#app')
