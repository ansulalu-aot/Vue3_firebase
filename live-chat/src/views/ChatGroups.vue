<template>
  <div class="container">
    <Navbar />
    <h2>Chat Groups</h2>
    <ul>
      <li v-for="group in chatGroups" :key="group.id">
        {{group}}
        <router-link :to="{ name: 'Chatroom', params: { groupId: group.id } }">{{ group.name }}</router-link>
        {{console.log('Group id:', group.id)}}
      </li>
    </ul>
  </div>
</template>

<script>
import useCollection from '../composables/useCollection'
import Navbar from '../components/Navbar.vue'
import getUser from '../composables/getUser'
import { watch } from 'vue'
import { useRouter } from 'vue-router'

export default {
  components: { Navbar },
  name: 'ChatGroups',
  setup() {
    const { user } = getUser()
    const router = useRouter()

    const { documents: chatGroups, error } = useCollection('chatGroups')
    console.log('Chat Groups:', chatGroups)
    console.log('Error:', error)

    watch(user, () => {
      if(!user.value) {
        router.push({ name: 'Welcome' })
      }
    })
    return {
      chatGroups,
      error
    }
  }
}
</script>

<style>
h2 {
  text-align: center;
}
</style>