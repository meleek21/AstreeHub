using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.Options;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ASTREE_PFE.Models
{
    public class Event
{
    // Unique identifier for the event (MongoDB uses ObjectId)
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    // Title of the event
    [BsonElement("title")]
    [Required]
    [StringLength(100, MinimumLength = 5)]
    public string Title { get; set; }

    // Description of the event
    [BsonElement("description")]
    [Required]
    [StringLength(500)]
    public string Description { get; set; }

    [BsonElement("eventType")]
    public EventType Type { get; set; } = EventType.Général;

    [BsonElement("isRecurring")]
    public bool IsRecurring { get; set; }

    [BsonElement("associatedEmployeeId")]
    public string AssociatedEmployeeId { get; set; }

    // Date and time of the event
    [BsonElement("eventDateTime")]
    [Required]
    public DateTime EventDateTime { get; set; }

    // Location of the event (physical or virtual)
    [BsonElement("location")]
    [Required]
    [StringLength(100)]
    public string Location { get; set; }

    // Organizer of the event (e.g., HR Department)
    [BsonElement("organizer")]
    [Required]
    [StringLength(50)]
    public string Organizer { get; set; }

    // Category of the event (e.g., Meeting, Training, Social Event)
    [BsonElement("category")]
    public EventCategory Category { get; set; }

    // List of attendees (stored as Employee IDs from SQL Server)
    [BsonElement("attendees")]
    public List<string> Attendees { get; set; } = new List<string>();

    // Dictionary to store attendance status for each attendee
    [BsonElement("attendeeStatuses")]
    public Dictionary<string, AttendanceStatus> AttendeeStatuses { get; set; } = new Dictionary<string, AttendanceStatus>();

    // Dictionary to track if an attendee's status is final (can't be changed)
    [BsonElement("attendeeStatusFinal")]
    public Dictionary<string, bool> AttendeeStatusFinal { get; set; } = new Dictionary<string, bool>();

    // Status of the event (e.g., Upcoming, Ongoing, Completed)
    [BsonElement("status")]
    public EventStatus Status { get; set; } = EventStatus.ÀVenir;

    // Indicates whether the event is open to everyone
    [BsonElement("isOpenEvent")]
    public bool IsOpenEvent { get; set; } = false;

    public static EventType GetEventType(EventCategory category)
    {
        switch (category)
        {
            case EventCategory.RéunionÉquipe:
            case EventCategory.RéunionDépartement:
            case EventCategory.RéunionClient:
            case EventCategory.EntretienIndividuel:
                return EventType.Réunion;
            case EventCategory.Atelier:
            case EventCategory.Certification:
            case EventCategory.Séminaire:
                return EventType.Formation;
            case EventCategory.Conférence:
            case EventCategory.TeamBuilding:
            case EventCategory.FêteEntreprise:
                return EventType.ÉvénementEntreprise;
            case EventCategory.Anniversaire:
            case EventCategory.AnniversaireTravail:
            case EventCategory.Absence:
                return EventType.Personnel;
            case EventCategory.MaintenanceSystème:
            case EventCategory.Déploiement:
                return EventType.Technique;
            case EventCategory.Autre:
            case EventCategory.Urgence:
                return EventType.Général;
            default:
                throw new ArgumentOutOfRangeException(nameof(category), category, null);
        }
    }
}
}