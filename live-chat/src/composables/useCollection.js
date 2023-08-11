import { ref, watchEffect } from 'vue'
import { projectFirestore } from '../firebase/config'

const useCollection = (parentCollection, subCollection) => {
    const documents = ref([])
    const error = ref(null)

    const addDoc = async (doc) => {
        error.value = null

        try {
            await projectFirestore.collection(parentCollection)
                .doc(doc.groupId)
                .collection(subCollection)
                .add(doc)
        } catch (err) {
            console.log(err.message)
            error.value = 'could not send the message'
        }
    }

    let collectionRef = projectFirestore.collection(parentCollection)
        .orderBy('createdAt')
    console.log('Collection Reference:', collectionRef)

    const unsub = collectionRef.onSnapshot((snap) => {
        console.log('snapshot')
        let results = []
        snap.docs.forEach(doc => {
            doc.data().createdAt && results.push({ ...doc.data(), id: doc.id })
        })
        documents.value = results
        error.value = null
        console.log('Documents:', documents.value)
    }, (err) => {
        console.log(err.message)
        error.value = 'could not fetch data'
    })

    watchEffect((onInvalidate) => {
        // Unsubscribe from the previous collection when the watcher is stopped (component unmounted)
        onInvalidate(() => unsub())
    })

    return { documents, error, addDoc }
}

export default useCollection
