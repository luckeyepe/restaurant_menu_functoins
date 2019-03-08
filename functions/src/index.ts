import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const updateClartDetailsOnCartCreate = functions.firestore
    .document("Cart/{userUid}/cart/{cartUid}")
    .onCreate(async (snapshot, context) => {
        //
        const brokenPath: string[] = snapshot.ref.path.split("/");
        const invokerUid: string = brokenPath[1];
        const cartData: FirebaseFirestore.DocumentData = snapshot.data()!!;
        const cartCost = cartData.cart_item_price * cartData.cart_item_count;

        try {
            const cartDetailsPromise = await admin.firestore()
                .doc("Cart_Details/"+invokerUid)
                .get();

            const cartDetails: FirebaseFirestore.DocumentData = cartDetailsPromise.data()!!;
            const currentItemCount: number = cartDetails.cart_detail_item_count;
            const currentCost:number = cartDetails.cart_detail_cost;

            return admin.firestore()
                .doc("Cart_Details/"+invokerUid)
                .update({
                    cart_detail_cost: currentCost + cartCost,
                    cart_detail_item_count: currentItemCount+1
                })
        }catch (e) {
            return admin.firestore()
                .doc("Cart_Details/"+invokerUid)
                .set({
                    cart_detail_cost: cartCost,
                    cart_detail_user_uid: invokerUid,
                    cart_detail_item_count: 1
                })
        }
    });