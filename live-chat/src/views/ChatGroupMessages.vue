<template>
  <div>
    <h1>Chat Group: {{ selectedChatGroup.name }}</h1>
    <div class="messages">
      <div v-for="message in messages" :key="message.id">
        {{ message.content }}
      </div>
    </div>
  </div>
</template>

<script>
import useCollection from '../composables/useCollection'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'ChatGroupMessages',
  setup() {
    const route = useRouter()
    const groupId = route.params.groupId

  // Fetch messages from Firestore for the selected chat group
  const { documents: messages } = useCollection('messages', (query) => {
    return query.where('groupId', '==', groupId).orderBy('createdAt')
  })

    // Fetch selected chat group details
    const { documents: chatGroups } = useCollection('chatGroups')
    const selectedChatGroup = ref(null)

    watch(chatGroups, () => {
      selectedChatGroup.value = chatGroups.find(group => group.id === groupId)
    })

    return {
      messages,
      selectedChatGroup
    }
  }
}
</script>
