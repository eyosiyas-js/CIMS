# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.base_class import Base  # noqa
from app.models.organization_role import Organization, Role  # noqa
from app.models.user import User  # noqa
from app.models.operational import Camera, Detection  # noqa
from app.models.utility import Notification, FormTemplate  # noqa
