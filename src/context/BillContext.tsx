import React, {
    createContext,
    useContext,
    useState,
} from "react";

type BillItem = {
    id: string;
    name: string;
    price: number;
    stock: number;
    qty: number;
    salt?: string;
    manufacturer?: string;
    strength?: string;
};

type BillContextType = {
    billItems: BillItem[];

    addToBill: (item: BillItem) => void;

    removeFromBill: (id: string) => void;

    clearBill: () => void;

    totalItems: number;

    totalAmount: number;
};

const BillContext = createContext<BillContextType | null>(null);

export const BillProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {

    const [billItems, setBillItems] = useState<BillItem[]>([]);

    const addToBill = (medicine: BillItem) => {

        const existing = billItems.find(
            (item) => item.id === medicine.id
        );
        //ya chk kra h k stock sy zada quantity add na hu or jo med quantiity increase krni h uski id match hugi to hi quantity update hugi
        if (existing) {

            if (existing.qty >= medicine.stock) {
                return;
            }

            setBillItems((prev) =>
                prev.map((item) =>
                    item.id === medicine.id
                        ? {
                            ...item,
                            qty: item.qty + medicine.qty,
                        }
                        : item
                )
            );

            return;
        }

        setBillItems((prev) => [
            ...prev,
            medicine,
        ]);

    };

    const removeFromBill = (id: string) => {

        setBillItems((prev) =>
            prev.filter((item) => item.id !== id)
        );

    };

    const clearBill = () => {

        setBillItems([]);

    };
    //reduce array ki sari quantity add krta h
    const totalItems = billItems.reduce(
        (sum, item) => sum + item.qty,
        0
    );

    const totalAmount = billItems.reduce(
        (sum, item) =>
            sum + item.qty * Number(item.price),
        0
    );

    return (
        <BillContext.Provider
            value={{
                billItems,
                addToBill,
                removeFromBill,
                clearBill,
                totalItems,
                totalAmount,
            }}
        >
            {children}
        </BillContext.Provider>
    );
};

export const useBill = () => {

    const context =
        useContext(BillContext);

    if (!context) {

        throw new Error(
            "useBill must be used inside BillProvider"
        );

    }

    return context;
};
