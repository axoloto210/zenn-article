"use client";

export default function HardNavigationButton() {
    const clickHandler = () => {
        if(window != undefined){
          window.location.reload()
        }
      }
  return (
    <button className="m-4 bg-blue-400" onClick={clickHandler}>
      hard navigation (reload)
    </button>
  );
}
