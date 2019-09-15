import Vue from 'vue'
import Bookmarks from './Bookmarks.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(Bookmarks),
}).$mount('#app')
