import mongoose from "mongoose";
import Cart from "../models/Cart";

export class CartService {
  static async mergeGuestCartToUser(
    guestToken: string,
    userId: string,
  ): Promise<void> {
    if (!guestToken || !userId) return;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const [guestCart, userCart] = await Promise.all([
        Cart.findOne({ guestToken }).session(session),
        Cart.findOne({ userId }).session(session),
      ]);

      if (!guestCart || guestCart.items.length === 0) {
        await session.abortTransaction();
        session.endSession();
        return;
      }
      if (!userCart) {
        guestCart.userId = new mongoose.Types.ObjectId(userId);
        guestCart.guestId = undefined;
        await guestCart.save({ session });

        await session.commitTransaction();
        session.endSession();
        return;
      }

      const mergedItemsMap = new Map<string, number>();

      for (const item of userCart.items) {
        mergedItemsMap.set(item.variantId.toString(), item.quantity);
      }

      for (const guestItem of guestCart.items) {
        const vId = guestItem.variantId.toString();
        const currentQty = mergedItemsMap.get(vId) || 0;

        mergedItemsMap.set(vId, currentQty + guestItem.quantity);
      }

      userCart.items = Array.from(mergedItemsMap.entries()).map(
        ([variantId, quantity]) => ({
          variantId: new mongoose.Types.ObjectId(variantId),
          quantity,
        }),
      );

      await userCart.save({ session });

      await Cart.deleteOne({ _id: guestCart._id }).session(session);

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
