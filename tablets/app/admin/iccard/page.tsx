import { ICCardListTable } from "@/app/components/Admin/ICCardListTable";

const ICCardMainPage: React.FC = () => {
    return (
        <div>
            <ICCardListTable cards={[{
                uid: "123",
                student_id: 1,
                status: "active",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }]}/>
        </div>
    )
}

export default ICCardMainPage;