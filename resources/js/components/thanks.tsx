const Thanks = () => {
    const date = new Date();
    const formattedDate = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`;
    return (
        <div className="hidden print:flex print:flex-col items-center text-sm py-4 mt-4">
            <i>Thank you for your patronage</i>
            <span><b>Printed:</b> {formattedDate}</span>
        </div>
    )
}

export default Thanks
