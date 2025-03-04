const Thanks = () => {
    const date = new Date();
    const formattedDate = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} - ${date.getHours()}:${date.getMinutes()}`;
    return (
        <div className="hidden print:block text-center text-sm">
            <div className="text-[1.1em] mb-4 space-y-2">
                <p>Address: No. 19 Yayo Plaza, Farm Center, Kano</p>
                <p><b>08033897859, 09014293881</b></p>
            </div>
            <div>Thank you for your patronage</div>
            <span><b>Printed:</b> {formattedDate}</span>
        </div>
    )
}

export default Thanks
