import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false


import VueFriendlyIframe from 'vue-friendly-iframe';
Vue.use(VueFriendlyIframe);


new Vue({
    render: h => h(App),
}).$mount('#app')