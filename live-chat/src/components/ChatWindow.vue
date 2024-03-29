<template>
  <div class="chat-window">
    <div v-if="error">{{ error }}</div>
    <div v-if="documents" class="messages" ref="messages">
      <div v-for="doc in formattedDocuments" :key="doc.id">
        <div class="message-container">
          <div :class="['single', { 'sender': doc.isSender, 'receiver': !doc.isSender }]">
            <span class="created-at">{{ doc.createdAt }}</span>
            <span class="name">{{ doc.name }}</span>
            <span class="message">{{ doc.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import getCollection from '../composables/getCollection'
import { formatDistanceToNow } from 'date-fns'
import { computed, onUpdated, ref } from 'vue'
import getUser from '../composables/getUser'

export default {
    setup() {
        const { error, documents } = getCollection('messages')
        const { user } = getUser()

        const formattedDocuments = computed(() => {
            if(documents.value) {
                return documents.value.map(doc => {
                    let time = formatDistanceToNow(doc.createdAt.toDate())
                    const isSender = doc.name === user.value.displayName
                    return { ...doc, createdAt: time, isSender: isSender }
                })
            }
        })

        // auto-scroll to bottom of messages
        const messages = ref(null)

        onUpdated(() => {
            messages.value.scrollTop = messages.value.scrollHeight
        })

        return { error, documents, formattedDocuments, messages }
    }
}
</script>

<style>
.chat-window {
    background: #fafafa;
    padding: 30px 20px;
}
.message-container {
    display: flex;
    flex-direction: column;
}
.single {
    margin: 10px 0;
    max-width: 80%;
    word-wrap: break-word;
    padding: 8px;
    border-radius: 10px;
}
.created-at {
    display: block;
    color: #999;
    font-size: 12px;
    margin-bottom: 4px;
}
.name {
    font-weight: bold;
    margin-right: 6px;
}
.messages {
    max-height: 400px;
    overflow: auto;
}
.sender {
    margin-right: 5px;
    align-self: flex-end;
    background-color: #dcf8c6;
}
.receiver {
    align-self: flex-start;
    background-color: #f3f3f3
}
</style>
