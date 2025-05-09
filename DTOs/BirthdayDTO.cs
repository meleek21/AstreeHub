public class BirthdayResponseDTO
{
    public string EmployeeId { get; set; }
    public string FullName { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public int Age { get; set; }
    public string ProfilePictureUrl { get; set; }
    public DateTime NextBirthday { get; set; }
    public int DaysUntilNextBirthday { get; set; }
}

public class BirthdayEventDTO
{
    public string Title { get; set; }
    public DateTime Date { get; set; }
    public string EmployeeName { get; set; }
    public int TurningAge { get; set; }
}
