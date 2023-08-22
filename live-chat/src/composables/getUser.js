import { ref } from "vue";
import { projectAuth, projectFirestore } from "@/firebase/config";

const user = ref(null)

projectAuth.onAuthStateChanged(async _user => {
    console.log('User state change. Current user is:', _user);
    user.value = _user;

    if (_user) {
        const superusersRef = projectFirestore.collection('superusers');
        const superusersSnapshot = await superusersRef.where('emails', 'array-contains', _user.email).get();

        if (!superusersSnapshot.empty) {
            user.value.role = 'superadmin';
        } else {
            user.value.role = 'user';
        }
    } else {
        user.value = ''
    }
    console.log("user.value.role:", user.value.role)
});

const getUser = () => {
    return { user }
}

export default getUser