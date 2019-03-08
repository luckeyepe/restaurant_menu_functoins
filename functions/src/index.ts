import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const updateClartDetailsOnCartCreate = functions.firestore
    .document("Cart/{userUid}/cart/{cartUid}")
    .onCreate(async (snapshot, context) => {
        //
        const brokenPath: string[] = snapshot.ref.path.split("/");
        const invokerUid: string = brokenPath[1];
        const cartData = snapshot.data();
        // @ts-ignore
        const cartCost = cartData.cart_item_price * cartData.cart_item_count;

        //update uid
        await admin.firestore().doc(snapshot.ref.path).update({
            cart_uid: snapshot.id
        });


        try {
            const cartDetailsPromise = await admin.firestore()
                .doc("Cart_Details/"+invokerUid)
                .get();

            const cartDetails = cartDetailsPromise.data();
            // @ts-ignore
            const currentItemCount: number = cartDetails.cart_detail_item_count;
            // @ts-ignore
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

export const updateClartDetailsOnCartUpdate = functions.firestore
    .document("Cart/{userUid}/cart/{cartUid}")
    .onUpdate(async (change, context) => {
        // @ts-ignore
        const itemBefore = change.before.data();
        // @ts-ignore
        const itemAfter = change.after.data();

        // @ts-ignore
        if (itemAfter.cart_item_count === itemBefore.cart_item_count){
            console.log("Nothing changed");
            return null
        }else {
            // @ts-ignore
            const brokenPath: string[] = itemAfter.ref.path.split("/");
            const invokerUid: string = brokenPath[1];
            // @ts-ignore
            const cartData = itemAfter.data();
            // @ts-ignore
            const cartCost = cartData.cart_item_price * cartData.cart_item_count;

            const cartDetailsPromise = await admin.firestore()
                .doc("Cart_Details/"+invokerUid)
                .get();

            const cartDetails = cartDetailsPromise.data();
            // @ts-ignore
            let currentItemCount: number = cartDetails.cart_detail_item_count;
            // @ts-ignore
            let currentCost:number = cartDetails.cart_detail_cost;

            // @ts-ignore
            if (itemAfter.cart_item_count<itemBefore.cart_item_count){
                // @ts-ignore
                const countAfter = itemAfter.cart_item_count;
                // @ts-ignore
                const countBefore = itemBefore.cart_item_count;
                currentItemCount = currentItemCount - countBefore + countAfter - 1;

                // @ts-ignore
                const cartCostBefore = itemBefore.cart_item_price * itemBefore.cart_item_count;
                currentCost = currentCost + cartCost - cartCostBefore;

                return admin.firestore()
                    .doc("Cart_Details/" + invokerUid)
                    .update({
                        cart_detail_cost: currentCost,
                        cart_detail_item_count: currentItemCount
                    })
            }else {
                // @ts-ignore
                const count = itemAfter.cart_item_count;
                // @ts-ignore
                const cartCostBefore = itemBefore.cart_item_price * itemBefore.cart_item_count;

                return admin.firestore()
                    .doc("Cart_Details/" + invokerUid)
                    .update({
                        cart_detail_cost: currentCost + cartCost - cartCostBefore,
                        cart_detail_item_count: currentItemCount - 1 + count
                    })
            }

        }
    });