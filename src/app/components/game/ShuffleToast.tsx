import { HyperIcon } from "./hyperUi";

export function ShuffleToast() {
  return (
    <div
      className="hyper-toast"
    >
      <HyperIcon name="shuffle" />
      <div className="hyper-toast-title">
        Hết đường đi!
      </div>
      <div className="hyper-toast-copy">
        Đang trộn lại bảng...
      </div>
    </div>
  );
}
